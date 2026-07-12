import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  console.log("DELETE /api/admin/associations/[id] - isAdmin:", isAdmin);

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  console.log("DELETE association id:", id);

  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from("associations")
      .delete()
      .eq("id", id);

    console.log("Delete result - error:", error);

    if (error) {
      console.error("Delete association failed:", error);
      return NextResponse.json(
        { ok: false, error: error.message || "delete_failed" },
        { status: 500 }
      );
    }

    console.log("Association deleted successfully:", id);
    return NextResponse.json({ ok: true, success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "server_error" },
      { status: 500 }
    );
  }
}
