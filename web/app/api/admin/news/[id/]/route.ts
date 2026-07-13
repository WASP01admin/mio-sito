import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function verifyAdminToken(request: NextRequest) {
  const adminToken = request.headers.get("X-Admin-Token");
  return adminToken === process.env.ADMIN_SECRET_KEY;
}

// DELETE: Remove news (association or press)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifyAdminToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    // Try to delete from association_news first
    const { data: assocData, error: assocError } = await supabaseAdmin
      .from("association_news")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!assocError && assocData) {
      return NextResponse.json({
        success: true,
        message: "Association news deleted",
        type: "association",
      });
    }

    // If not found in association_news, try press_articles
    const { data: pressData, error: pressError } = await supabaseAdmin
      .from("press_articles")
      .delete()
      .eq("id", id)
      .select()
      .maybeSingle();

    if (!pressError && pressData) {
      return NextResponse.json({
        success: true,
        message: "Press article deleted",
        type: "press",
      });
    }

    // Not found in either table
    return NextResponse.json(
      { error: "News item not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Admin news delete error:", error);
    return NextResponse.json(
      { error: "Deletion failed" },
      { status: 500 }
    );
  }
}
