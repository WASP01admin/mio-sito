import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get("X-Admin-Token");
    const expectedToken = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "";

    if (!adminToken || adminToken !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { article_id, quantity = 1 } = await request.json();

    if (!article_id || typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Add multiple likes as admin (bypass uniqueness constraint)
    const likes = Array.from({ length: quantity }, (_, i) => ({
      article_id,
      session_id: `admin-boost-${Date.now()}-${i}`,
    }));

    const { error } = await supabaseAdmin
      .from("article_likes")
      .insert(likes);

    if (error) {
      console.error("Add likes error:", error);
      return NextResponse.json(
        { error: "Failed to add likes" },
        { status: 500 }
      );
    }

    // Get updated count
    const { data: likesList, error: countError } = await supabaseAdmin
      .from("article_likes")
      .select("id", { count: "exact" })
      .eq("article_id", article_id);

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { error: "Failed to get count" },
        { status: 500 }
      );
    }

    const likeCount = likesList?.length || 0;

    return NextResponse.json({
      success: true,
      likeCount,
      added: quantity,
    });
  } catch (error) {
    console.error("Admin add likes error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
