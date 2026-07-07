import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateToken } from "@/lib/membership-code";
import { resend, RESEND_FROM } from "@/lib/resend";
import { verifyEmail } from "@/lib/email-templates";
import { resolveLocale } from "@/lib/locale";
import { isValidEmail } from "@/lib/validation";

const TOKEN_EXPIRY_DAYS = 7;
const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Always returns a generic success response regardless of whether the email
// matched anything, is already verified, or is still in cooldown -- so this
// endpoint can't be used to enumerate registered emails or probe state.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const locale = resolveLocale(typeof body?.locale === "string" ? body.locale : null);

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id, nickname, token_expires_at, token_purpose")
    .eq("email", email)
    .eq("is_verified", false)
    .maybeSingle();

  if (error) {
    console.error("Resend lookup failed:", error);
    return NextResponse.json({ ok: true });
  }

  if (data && (data.token_purpose ?? "signup") === "signup") {
    const previousExpiresAt = data.token_expires_at ? new Date(data.token_expires_at).getTime() : 0;
    const previousCreatedAt = previousExpiresAt - TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const cooledDown = Date.now() - previousCreatedAt > RESEND_COOLDOWN_MS;

    if (cooledDown) {
      const token = generateToken();
      const tokenExpiresAt = new Date(
        Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error: updateError } = await supabaseAdmin
        .from("user_profiles")
        .update({ verification_token: token, token_expires_at: tokenExpiresAt })
        .eq("id", data.id);

      if (!updateError) {
        const verificationUrl = `${siteUrl()}/api/verify?token=${token}&locale=${locale}`;
        const { subject, html } = verifyEmail({
          nickname: data.nickname ?? "there",
          verificationUrl,
        });
        try {
          await resend.emails.send({ from: RESEND_FROM, to: email, subject, html });
        } catch (sendError) {
          console.error("Resend verification email failed:", sendError);
        }
      } else {
        console.error("Resend token update failed:", updateError);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
