import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateUniqueMembershipCode, generateToken } from "@/lib/membership-code";
import { isValidEmail } from "@/lib/validation";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(value: unknown): string | null {
  const trimmed = str(value);
  return trimmed || null;
}

// Full manual member creation, for backfilling data, correcting mistakes,
// or registering someone entirely outside the normal self-serve flow. No
// notification email is sent -- admin is expected to communicate directly
// when using this path.
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const nickname = str(body?.nickname);
  const email = str(body?.email).toLowerCase();
  const firstName = optionalStr(body?.firstName);
  const lastName = optionalStr(body?.lastName);
  const fiscalCode = optionalStr(body?.fiscalCode);
  const notes1 = optionalStr(body?.notes1);
  const notes2 = optionalStr(body?.notes2);
  const associationId = str(body?.associationId);
  const isVerified = body?.isVerified === true;
  const membershipStatus = VALID_STATUSES.includes(body?.membershipStatus)
    ? body.membershipStatus
    : "pending";
  const expiresAtInput = str(body?.expiresAt);

  if (!nickname || !email || !isValidEmail(email) || !associationId) {
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

  const { data: association, error: associationError } = await supabaseAdmin
    .from("associations")
    .select("id, code")
    .eq("id", associationId)
    .maybeSingle();

  if (associationError || !association) {
    return NextResponse.json({ ok: false, error: "association_not_found" }, { status: 400 });
  }

  let expiresAt: string | null = null;
  if (membershipStatus === "approved") {
    expiresAt = expiresAtInput
      ? new Date(expiresAtInput).toISOString()
      : new Date(Date.now() + ONE_YEAR_MS).toISOString();
  } else if (expiresAtInput) {
    expiresAt = new Date(expiresAtInput).toISOString();
  }

  const uniqueCode = isVerified
    ? await generateUniqueMembershipCode(association.code)
    : null;
  const walletAuthToken = isVerified ? generateToken() : null;

  const { data: created, error: insertError } = await supabaseAdmin
    .from("user_profiles")
    .insert({
      association_id: association.id,
      nickname,
      email,
      first_name: firstName,
      last_name: lastName,
      fiscal_code: fiscalCode,
      notes_1: notes1,
      notes_2: notes2,
      is_verified: isVerified,
      unique_membership_code: uniqueCode,
      wallet_authentication_token: walletAuthToken,
      membership_status: membershipStatus,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("Manual member creation failed:", insertError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: created.id,
    field: "membership_status",
    old_value: null,
    new_value: `${membershipStatus} (manual entry)`,
  });

  return NextResponse.json({ ok: true, code: uniqueCode });
}
