import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({ membership_status: "rejected" })
    .eq("id", id);

  if (updateError) {
    console.error("Reject failed:", updateError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: id,
    field: "membership_status",
    old_value: existing.membership_status,
    new_value: "rejected",
  });

  return NextResponse.json({ ok: true });
}
