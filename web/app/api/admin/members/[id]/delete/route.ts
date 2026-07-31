import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/**
 * DELETE /api/admin/members/[id]/delete
 * Permanently delete a user profile from the system.
 * This allows them to re-register with the same email.
 * ADMIN ONLY - use with caution!
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify user exists before deleting
    const { data: user, error: lookupError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, nickname")
      .eq("id", id)
      .maybeSingle();

    if (lookupError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hard delete the user profile (cascading deletes should handle related records)
    const { error: deleteError } = await supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(`Failed to delete user ${id}:`, deleteError);
      return NextResponse.json(
        { error: `Delete failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.email} (${user.nickname}) permanently deleted`,
      deletedUser: { id, email: user.email, nickname: user.nickname },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
