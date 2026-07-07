import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { uploadMemberPhoto } from "@/lib/storage";
import { generateToken } from "@/lib/membership-code";
import { resend, RESEND_FROM } from "@/lib/resend";
import { verifyEmail } from "@/lib/email-templates";
import { resolveLocale } from "@/lib/locale";
import { isValidEmail } from "@/lib/validation";
import { validateNickname } from "@/lib/nickname-validation";
import { WASP_DIRECT_ASSOCIATION_CODE } from "@/lib/constants";

const TOKEN_EXPIRY_DAYS = 7;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form_data" }, { status: 400 });
  }

  const nicknameResult = validateNickname(str(formData.get("nickname")));
  const email = str(formData.get("email")).toLowerCase();
  const firstName = str(formData.get("firstName"));
  const lastName = str(formData.get("lastName"));
  const fiscalCode = str(formData.get("fiscalCode")).toUpperCase();
  const notes1 = str(formData.get("notes1")) || null;
  const notes2 = str(formData.get("notes2")) || null;
  const locale = resolveLocale(formData.get("locale")?.toString());
  const photo = formData.get("photo");

  if (!nicknameResult.valid) {
    return NextResponse.json({ ok: false, error: `nickname_${nicknameResult.error}` }, { status: 400 });
  }
  const nickname = nicknameResult.value;
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });
  }
  if (!fiscalCode) {
    return NextResponse.json({ ok: false, error: "fiscal_code_required" }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    console.error("Direct registration lookup failed:", existingError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ ok: false, error: "email_already_registered" }, { status: 409 });
  }

  const { data: waspAssociation, error: associationError } = await supabaseAdmin
    .from("associations")
    .select("id")
    .eq("code", WASP_DIRECT_ASSOCIATION_CODE)
    .maybeSingle();

  if (associationError || !waspAssociation) {
    console.error("Direct registration: WASP association record missing", associationError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
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

  const token = generateToken();
  const tokenExpiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: insertError } = await supabaseAdmin.from("user_profiles").insert({
    association_id: waspAssociation.id,
    nickname,
    email,
    first_name: firstName,
    last_name: lastName,
    fiscal_code: fiscalCode,
    notes_1: notes1,
    notes_2: notes2,
    photo_path: photoPath,
    verification_token: token,
    token_expires_at: tokenExpiresAt,
    token_purpose: "signup",
  });

  if (insertError) {
    console.error("Failed to create direct user_profiles row:", insertError);
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
