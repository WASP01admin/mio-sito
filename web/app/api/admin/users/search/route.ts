import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/admin/users/search?email=...
 * Search for a user by email
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, nickname, membership_status, is_verified, created_at")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("User search failed:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
