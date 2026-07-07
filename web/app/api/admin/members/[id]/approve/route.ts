import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("user_profiles")
    .select("membership_status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({ membership_status: "approved", expires_at: expiresAt })
    .eq("id", id);

  if (updateError) {
    console.error("Approve failed:", updateError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert([
    {
      entity_type: "user_profile",
      entity_id: id,
      field: "membership_status",
      old_value: existing.membership_status,
      new_value: "approved",
    },
    {
      entity_type: "user_profile",
      entity_id: id,
      field: "expires_at",
      old_value: null,
      new_value: expiresAt,
    },
  ]);

  // Wallet push notifications aren't wired up yet -- once the wallet pass
  // layer exists, this is where an approval triggers the Apple/Google
  // Wallet update from "Temporary" to "Active" on the user's device.

  return NextResponse.json({ ok: true });
}
