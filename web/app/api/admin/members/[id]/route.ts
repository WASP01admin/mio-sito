import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isValidEmail } from "@/lib/validation";

interface ExistingRow {
  nickname: string | null;
  first_name: string | null;
  last_name: string | null;
  fiscal_code: string | null;
  notes_1: string | null;
  notes_2: string | null;
  email: string;
  association_id: string;
  is_verified: boolean;
  membership_status: string;
  expires_at: string | null;
  unique_membership_code: string | null;
}

const TEXT_FIELDS = [
  "nickname",
  "first_name",
  "last_name",
  "fiscal_code",
  "notes_1",
  "notes_2",
  "unique_membership_code",
] as const satisfies readonly (keyof ExistingRow)[];

const VALID_STATUSES = ["pending", "approved", "rejected"];

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("user_profiles")
    .select(
      "nickname, first_name, last_name, fiscal_code, notes_1, notes_2, email, association_id, is_verified, membership_status, expires_at, unique_membership_code"
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const existingRow = existing as ExistingRow;
  const updates: Record<string, unknown> = {};
  const auditEntries: {
    entity_type: string;
    entity_id: string;
    field: string;
    old_value: string | null;
    new_value: string | null;
  }[] = [];

  function recordChange(field: string, oldValue: unknown, newValue: unknown) {
    if (oldValue === newValue) return;
    updates[field] = newValue;
    auditEntries.push({
      entity_type: "user_profile",
      entity_id: id,
      field,
      old_value: oldValue == null ? null : String(oldValue),
      new_value: newValue == null ? null : String(newValue),
    });
  }

  for (const field of TEXT_FIELDS) {
    if (!(field in body)) continue;
    const newValue = field === "nickname" ? (str(body[field]) ?? "") : str(body[field]);
    recordChange(field, existingRow[field], newValue);
  }

  if ("email" in body) {
    const newEmail = str(body.email)?.toLowerCase() ?? "";
    if (!isValidEmail(newEmail)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    if (newEmail !== existingRow.email) {
      const { data: emailTaken } = await supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("email", newEmail)
        .neq("id", id)
        .maybeSingle();
      if (emailTaken) {
        return NextResponse.json({ ok: false, error: "email_already_registered" }, { status: 409 });
      }
      recordChange("email", existingRow.email, newEmail);
    }
  }

  if ("associationId" in body && typeof body.associationId === "string" && body.associationId) {
    if (body.associationId !== existingRow.association_id) {
      const { data: association } = await supabaseAdmin
        .from("associations")
        .select("id")
        .eq("id", body.associationId)
        .maybeSingle();
      if (!association) {
        return NextResponse.json({ ok: false, error: "association_not_found" }, { status: 400 });
      }
      recordChange("association_id", existingRow.association_id, body.associationId);
    }
  }

  if ("isVerified" in body) {
    const newValue = body.isVerified === true;
    recordChange("is_verified", existingRow.is_verified, newValue);
  }

  if ("membershipStatus" in body && VALID_STATUSES.includes(body.membershipStatus)) {
    recordChange("membership_status", existingRow.membership_status, body.membershipStatus);
  }

  if ("expiresAt" in body) {
    const raw = str(body.expiresAt);
    const newValue = raw ? new Date(raw).toISOString() : null;
    recordChange("expires_at", existingRow.expires_at, newValue);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    console.error("Edit member failed:", updateError);
    const isDuplicate = updateError.code === "23505";
    return NextResponse.json(
      { ok: false, error: isDuplicate ? "duplicate_code" : "server_error" },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  await supabaseAdmin.from("audit_log").insert(auditEntries);

  return NextResponse.json({ ok: true });
}
