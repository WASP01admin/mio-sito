import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { uploadMemberPhoto } from "@/lib/storage";
import { generateToken } from "@/lib/membership-code";
import { resend, RESEND_FROM } from "@/lib/resend";
import { associationNotFoundEmail, verifyEmail } from "@/lib/email-templates";
import { resolveLocale } from "@/lib/locale";
import { isValidEmail } from "@/lib/validation";
import { validateNickname } from "@/lib/nickname-validation";
import { ADMIN_CONTACT_EMAIL } from "@/lib/constants";

const TOKEN_EXPIRY_DAYS = 7;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form_data" }, { status: 400 });
  }

  const nicknameResult = validateNickname(String(formData.get("nickname") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const associationId = formData.get("associationId");
  const associationQuery = String(formData.get("associationQuery") ?? "").trim();
  const locale = resolveLocale(formData.get("locale")?.toString());
  const photo = formData.get("photo");

  if (!nicknameResult.valid) {
    return NextResponse.json({ ok: false, error: `nickname_${nicknameResult.error}` }, { status: 400 });
  }
  const nickname = nicknameResult.value;
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!associationId && !associationQuery) {
    return NextResponse.json({ ok: false, error: "association_required" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    console.error("Registration lookup failed:", existingError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ ok: false, error: "email_already_registered" }, { status: 409 });
  }

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoPath = await uploadMemberPhoto(photo);
    } catch (error) {
      console.error("Photo upload failed:", error);
      return NextResponse.json({ ok: false, error: "photo_upload_failed" }, { status: 500 });
    }
  }

  // Branch A: the user picked an exact association from the autocomplete
  // dropdown, so the ID is authoritative -- re-verify it exists (defense in
  // depth) and go straight to the user's own verification email.
  if (typeof associationId === "string" && associationId) {
    const { data: association, error: associationError } = await supabaseAdmin
      .from("associations")
      .select("id")
      .eq("id", associationId)
      .maybeSingle();

    if (associationError) {
      console.error("Association lookup failed:", associationError);
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }
    if (!association) {
      return NextResponse.json({ ok: false, error: "association_not_found" }, { status: 400 });
    }

    const token = generateToken();
    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: insertError } = await supabaseAdmin.from("user_profiles").insert({
      association_id: association.id,
      nickname,
      email,
      photo_path: photoPath,
      verification_token: token,
      token_expires_at: tokenExpiresAt,
      token_purpose: "signup",
    });

    if (insertError) {
      console.error("Failed to create user_profiles row:", insertError);
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    const verificationUrl = `${siteUrl()}/api/verify?token=${token}&locale=${locale}`;
    const { subject, html } = verifyEmail({ nickname, verificationUrl });

    try {
      await resend.emails.send({ from: RESEND_FROM, to: email, subject, html });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      return NextResponse.json({ ok: false, error: "email_send_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "verify_email_sent" });
  }

  // Branch B: no association was matched/selected. Nothing gets silently
  // dropped -- log it for manual follow-up and let the user know by email.
  const { error: pendingError } = await supabaseAdmin.from("pending_submissions").insert({
    email,
    nickname,
    submitted_association_string: associationQuery,
    photo_path: photoPath,
  });

  if (pendingError) {
    console.error("Failed to create pending_submissions row:", pendingError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const dataCollectionUrl = `mailto:${ADMIN_CONTACT_EMAIL}?subject=${encodeURIComponent(
    "My association isn't in the WASP database"
  )}&body=${encodeURIComponent(
    `Hi,\n\nI tried to register for a WASP Card under "${associationQuery}" but it wasn't found.\n\nOfficial name:\nCity/Country:\nWebsite or social page:\n`
  )}`;
  const { subject, html } = associationNotFoundEmail({
    nickname,
    submittedAssociation: associationQuery,
    dataCollectionUrl,
  });

  try {
    await resend.emails.send({ from: RESEND_FROM, to: email, subject, html });
  } catch (error) {
    console.error("Failed to send association-not-found email:", error);
    return NextResponse.json({ ok: false, error: "email_send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "association_not_found_email_sent" });
}
