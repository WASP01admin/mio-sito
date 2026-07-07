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

  const { data: channel, error: fetchError } = await supabaseAdmin
    .from("chat_channels")
    .select("id, slug, is_default")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !channel) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (channel.is_default) {
    return NextResponse.json({ ok: false, error: "cannot_delete_default" }, { status: 400 });
  }

  // Cascades to chat_messages, which cascades to reactions and reports.
  const { error: deleteError } = await supabaseAdmin.from("chat_channels").delete().eq("id", id);

  if (deleteError) {
    console.error("Delete channel failed:", deleteError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "chat_channel",
    entity_id: id,
    field: "deleted",
    old_value: channel.slug,
    new_value: null,
  });

  return NextResponse.json({ ok: true });
}
