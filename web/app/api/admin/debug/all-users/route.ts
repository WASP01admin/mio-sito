import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/admin/debug/all-users
 * DEBUG ONLY: Show all users in the database
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, nickname, membership_status, is_verified, token_purpose, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length ?? 0,
      users: data ?? []
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
