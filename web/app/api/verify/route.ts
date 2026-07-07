import { NextRequest, NextResponse, userAgent } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateUniqueMembershipCode, generateToken } from "@/lib/membership-code";
import { resolveLocale } from "@/lib/locale";
import { resend, RESEND_FROM } from "@/lib/resend";
import { associationConfirmationEmail } from "@/lib/email-templates";
import { WASP_DIRECT_ASSOCIATION_CODE } from "@/lib/constants";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface AssociationRef {
  code: string;
  name: string;
  email: string | null;
}

interface VerifyRow {
  id: string;
  nickname: string | null;
  email: string;
  token_expires_at: string | null;
  token_purpose: string | null;
  is_verified: boolean;
  associations: AssociationRef | AssociationRef[] | null;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function associationOf(row: VerifyRow): AssociationRef | null {
  const value = row.associations;
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// Best-effort: the association's own confirmation is a separate, manual
// process (admin reads their reply and approves later). A failure here
// must never block the user from seeing their own success page.
async function notifyAssociation(userProfileId: string, association: AssociationRef, memberEmail: string) {
  if (association.code === WASP_DIRECT_ASSOCIATION_CODE) {
    // Direct-to-WASP members have no external association to confirm with --
    // WASP is the sole verifier, via the identity fields collected at signup.
    return;
  }

  if (!association.email) {
    console.warn(
      `Verify: association ${association.code} has no email on file, skipping auto-notification for profile ${userProfileId}`
    );
    return;
  }

  try {
    const confirmationToken = generateToken();
    const yesUrl = `${siteUrl()}/api/association-confirm?token=${confirmationToken}&answer=yes`;
    const noUrl = `${siteUrl()}/api/association-confirm?token=${confirmationToken}&answer=no`;

    const { subject, html } = associationConfirmationEmail({
      memberEmail,
      associationName: association.name,
      yesUrl,
      noUrl,
    });
    await resend.emails.send({ from: RESEND_FROM, to: association.email, subject, html });

    const contactedAt = new Date().toISOString();
    await supabaseAdmin
      .from("user_profiles")
      .update({
        association_contacted_at: contactedAt,
        association_confirmation_token: confirmationToken,
      })
      .eq("id", userProfileId);
    await supabaseAdmin.from("audit_log").insert({
      entity_type: "user_profile",
      entity_id: userProfileId,
      field: "association_contacted_at",
      old_value: null,
      new_value: contactedAt,
    });
  } catch (error) {
    console.error("Failed to notify association:", error);
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const locale = resolveLocale(request.nextUrl.searchParams.get("locale"));
  const { device } = userAgent(request);
  const isMobile = device.type === "mobile";
  const base = `${siteUrl()}/${locale}`;

  if (!token) {
    return NextResponse.redirect(`${base}/registrati/errore?reason=missing_token`);
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select(
      "id, nickname, email, token_expires_at, token_purpose, is_verified, associations(code, name, email)"
    )
    .eq("verification_token", token)
    .maybeSingle();

  if (error) {
    console.error("Verify lookup failed:", error);
    return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
  }

  const profile = data as VerifyRow | null;
  if (!profile) {
    return NextResponse.redirect(`${base}/registrati/errore?reason=invalid_token`);
  }

  const expiresAt = profile.token_expires_at ? new Date(profile.token_expires_at) : null;
  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(`${base}/registrati/errore?reason=expired_token`);
  }

  if (profile.token_purpose === "renewal") {
    const newExpiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();
    const { error: renewError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        expires_at: newExpiresAt,
        verification_token: null,
        token_expires_at: null,
        token_purpose: null,
      })
      .eq("id", profile.id);

    if (renewError) {
      console.error("Renewal update failed:", renewError);
      return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
    }

    await supabaseAdmin.from("audit_log").insert({
      entity_type: "user_profile",
      entity_id: profile.id,
      field: "expires_at",
      old_value: null,
      new_value: newExpiresAt,
    });

    return NextResponse.redirect(`${base}/registrati/successo?renewed=true`);
  }

  if (profile.is_verified) {
    return NextResponse.redirect(`${base}/registrati/successo?mobile=${isMobile}`);
  }

  const association = associationOf(profile);
  if (!association) {
    console.error("Verify: profile has no resolvable association", profile.id);
    return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
  }

  const uniqueCode = await generateUniqueMembershipCode(association.code);
  const walletAuthToken = generateToken();

  const { error: verifyUpdateError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      is_verified: true,
      unique_membership_code: uniqueCode,
      wallet_authentication_token: walletAuthToken,
      verification_token: null,
      token_expires_at: null,
      token_purpose: null,
    })
    .eq("id", profile.id);

  if (verifyUpdateError) {
    console.error("Verify update failed:", verifyUpdateError);
    return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: profile.id,
    field: "is_verified",
    old_value: "false",
    new_value: "true",
  });

  await notifyAssociation(profile.id, association, profile.email);

  return NextResponse.redirect(
    `${base}/registrati/successo?code=${encodeURIComponent(uniqueCode)}&mobile=${isMobile}&chatToken=${encodeURIComponent(walletAuthToken)}`
  );
}
