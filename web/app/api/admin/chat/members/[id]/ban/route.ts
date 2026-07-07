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
  const banned = body?.banned === true;

  if (banned) {
    const { error } = await supabaseAdmin
      .from("chat_bans")
      .insert({ user_profile_id: id })
      .select()
      .maybeSingle();
    // Duplicate ban (already banned) is a no-op, not an error.
    if (error && error.code !== "23505") {
      console.error("Ban failed:", error);
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }
  } else {
    const { error } = await supabaseAdmin
      .from("chat_bans")
      .delete()
      .eq("user_profile_id", id);
    if (error) {
      console.error("Unban failed:", error);
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: id,
    field: "chat_banned",
    old_value: String(!banned),
    new_value: String(banned),
  });

  return NextResponse.json({ ok: true });
}
