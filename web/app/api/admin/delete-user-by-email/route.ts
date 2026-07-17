import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/admin/delete-user-by-email
 * Delete a user by email (DEBUG/ADMIN ONLY)
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Find user first
    const { data: user, error: findError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, nickname")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (findError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user
    const { error: deleteError } = await supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", user.id);

    if (deleteError) {
      console.error("Delete failed:", deleteError);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✅ Deleted ${user.email}`,
      deleted: user,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
