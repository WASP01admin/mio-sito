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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("x-admin-token");
    if (!verifyAdminToken(token)) {
      console.error("Token mismatch. Received:", token?.substring(0, 10), "Expected:", process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY?.substring(0, 10));
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: newsId } = await params;
    if (!newsId) {
      return NextResponse.json({ error: "Invalid news ID" }, { status: 400 });
    }

    // Check if exists in press_articles first
    const { data: pressArticle, error: pressCheckError } = await supabaseAdmin
      .from("press_articles")
      .select("id")
      .eq("id", newsId)
      .maybeSingle();

    if (pressCheckError) {
      console.error("Press check error:", pressCheckError);
      return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
    }

    if (pressArticle) {
      // Delete from press_articles
      const { error: deleteError } = await supabaseAdmin
        .from("press_articles")
        .delete()
        .eq("id", newsId);

      if (deleteError) {
        console.error("Press delete error:", deleteError);
        return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
      }

      return NextResponse.json({ success: true, deletedFrom: "press_articles" });
    }

    // Check if exists in association_news
    const { data: assocArticle, error: assocCheckError } = await supabaseAdmin
      .from("association_news")
      .select("id")
      .eq("id", newsId)
      .maybeSingle();

    if (assocCheckError) {
      console.error("Association check error:", assocCheckError);
      return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
    }

    if (assocArticle) {
      // Delete from association_news
      const { error: deleteError } = await supabaseAdmin
        .from("association_news")
        .delete()
        .eq("id", newsId);

      if (deleteError) {
        console.error("Association delete error:", deleteError);
        return NextResponse.json({ error: "Failed to delete news" }, { status: 500 });
      }

      return NextResponse.json({ success: true, deletedFrom: "association_news" });
    }

    // Not found in either table
    console.error("Article not found with ID:", newsId);
    return NextResponse.json({ error: "News item not found" }, { status: 404 });
  } catch (error) {
    console.error("Admin delete news error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
