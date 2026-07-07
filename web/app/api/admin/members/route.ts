import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateUniqueMembershipCode, generateToken } from "@/lib/membership-code";
import { resend, RESEND_FROM } from "@/lib/resend";
import { vipWelcomeEmail } from "@/lib/email-templates";
import { WASP_VIP_ASSOCIATION_CODE } from "@/lib/constants";
import { isValidEmail } from "@/lib/validation";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(value: unknown): string | null {
  const trimmed = str(value);
  return trimmed || null;
}

// Creates an already-active VIP/honorary member. No verification email, no
// payment, no association check -- admin vouches for them directly.
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const nickname = str(body?.nickname);
  const email = str(body?.email).toLowerCase();
  const firstName = optionalStr(body?.firstName);
  const lastName = optionalStr(body?.lastName);
  const notes1 = optionalStr(body?.notes1);
  const notes2 = optionalStr(body?.notes2);

  if (!nickname || !email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: false, error: "email_already_registered" }, { status: 409 });
  }

  const { data: vipAssociation, error: associationError } = await supabaseAdmin
    .from("associations")
    .select("id, code")
    .eq("code", WASP_VIP_ASSOCIATION_CODE)
    .maybeSingle();

  if (associationError || !vipAssociation) {
    console.error("VIP association record missing", associationError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const uniqueCode = await generateUniqueMembershipCode(vipAssociation.code);
  const walletAuthToken = generateToken();
  const expiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();

  const { data: created, error: insertError } = await supabaseAdmin
    .from("user_profiles")
    .insert({
      association_id: vipAssociation.id,
      nickname,
      email,
      first_name: firstName,
      last_name: lastName,
      notes_1: notes1,
      notes_2: notes2,
      is_verified: true,
      unique_membership_code: uniqueCode,
      wallet_authentication_token: walletAuthToken,
      membership_status: "approved",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("Failed to create VIP member:", insertError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: created.id,
    field: "membership_status",
    old_value: null,
    new_value: "approved (VIP)",
  });

  try {
    const { subject, html } = vipWelcomeEmail({ nickname, membershipCode: uniqueCode });
    await resend.emails.send({ from: RESEND_FROM, to: email, subject, html });
  } catch (error) {
    console.error("Failed to send VIP welcome email:", error);
  }

  return NextResponse.json({ ok: true, code: uniqueCode });
}
