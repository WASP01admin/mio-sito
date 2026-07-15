import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Verify admin token
function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;
  const expectedToken = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
  if (!expectedToken) return false;
  return token === expectedToken;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("x-admin-token");
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newsId = params.id;
    if (!newsId) {
      return NextResponse.json({ error: "Invalid news ID" }, { status: 400 });
    }

    // Try to delete from press_articles first (PRESS news items)
    const { error: pressError, data: pressData } = await supabaseAdmin
      .from("press_articles")
      .delete()
      .eq("id", newsId)
      .select()
      .maybeSingle();

    if (pressData) {
      // Successfully deleted from press_articles
      return NextResponse.json({ success: true, deletedFrom: "press_articles" });
    }

    // If not found in press_articles, try association_news
    const { error: assocError, data: assocData } = await supabaseAdmin
      .from("association_news")
      .delete()
      .eq("id", newsId)
      .select()
      .maybeSingle();

    if (assocData) {
      // Successfully deleted from association_news
      return NextResponse.json({ success: true, deletedFrom: "association_news" });
    }

    // If neither worked, return not found
    if (pressError || assocError) {
      console.error("Delete error:", pressError || assocError);
      return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
    }

    return NextResponse.json({ error: "News item not found" }, { status: 404 });
  } catch (error) {
    console.error("Admin delete news error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
