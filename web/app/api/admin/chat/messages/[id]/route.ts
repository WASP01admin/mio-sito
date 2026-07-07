import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("chat_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Delete message failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "chat_message",
    entity_id: id,
    field: "deleted_at",
    old_value: null,
    new_value: "deleted",
  });

  return NextResponse.json({ ok: true });
}
