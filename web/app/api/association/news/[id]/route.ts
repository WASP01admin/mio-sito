import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const associationId = request.cookies.get("wasp_association_id")?.value;

    if (!associationId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: news, error: fetchError } = await supabaseAdmin
      .from("association_news")
      .select("association_id")
      .eq("id", id)
      .single();

    if (fetchError || !news) {
      return NextResponse.json(
        { error: "News not found" },
        { status: 404 }
      );
    }

    if (news.association_id !== associationId) {
      return NextResponse.json(
        { error: "You can only delete your own news" },
        { status: 403 }
      );
    }

    // Delete news
    const { error: deleteError } = await supabaseAdmin
      .from("association_news")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { error: "Failed to delete news" },
      { status: 500 }
    );
  }
}
