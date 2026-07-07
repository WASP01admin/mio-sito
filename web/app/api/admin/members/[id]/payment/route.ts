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
  const body = await request.json().catch(() => null);
  const received = body?.received === true;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("user_profiles")
    .select("payment_received_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const newValue = received ? new Date().toISOString() : null;

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({ payment_received_at: newValue })
    .eq("id", id);

  if (updateError) {
    console.error("Payment toggle failed:", updateError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: id,
    field: "payment_received_at",
    old_value: existing.payment_received_at,
    new_value: newValue,
  });

  return NextResponse.json({ ok: true });
}
