import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { article_id, action } = await request.json();

    if (!article_id || !action || !["like", "unlike"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Use a session ID (for public users without auth)
    let session_id = request.headers.get("X-Session-ID");
    if (!session_id) {
      session_id = `anon-${Date.now()}-${Math.random()}`;
    }

    if (action === "like") {
      // Insert like
      const { error } = await supabaseAdmin
        .from("article_likes")
        .insert({
          article_id,
          session_id,
        });

      if (error && error.code !== "23505") { // 23505 = unique constraint violation (already liked)
        console.error("Like insert error:", error);
        return NextResponse.json(
          { error: "Failed to like article" },
          { status: 500 }
        );
      }
    } else {
      // Delete like
      const { error } = await supabaseAdmin
        .from("article_likes")
        .delete()
        .eq("article_id", article_id)
        .eq("session_id", session_id);

      if (error) {
        console.error("Like delete error:", error);
        return NextResponse.json(
          { error: "Failed to unlike article" },
          { status: 500 }
        );
      }
    }

    // Get updated like count
    const { data: likes, error: countError } = await supabaseAdmin
      .from("article_likes")
      .select("id", { count: "exact" })
      .eq("article_id", article_id);

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { error: "Failed to get like count" },
        { status: 500 }
      );
    }

    const likeCount = likes?.length || 0;

    return NextResponse.json({
      success: true,
      liked: action === "like",
      likeCount,
    });
  } catch (error) {
    console.error("Like API error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const article_id = request.nextUrl.searchParams.get("article_id");

    if (!article_id) {
      return NextResponse.json(
        { error: "article_id required" },
        { status: 400 }
      );
    }

    // Get like count
    const { data: likes, error } = await supabaseAdmin
      .from("article_likes")
      .select("id", { count: "exact" })
      .eq("article_id", article_id);

    if (error) {
      console.error("Count error:", error);
      return NextResponse.json(
        { error: "Failed to get like count" },
        { status: 500 }
      );
    }

    const likeCount = likes?.length || 0;

    // Check if current session has liked
    const session_id = request.headers.get("X-Session-ID");
    let userLiked = false;

    if (session_id) {
      const { data: userLike } = await supabaseAdmin
        .from("article_likes")
        .select("id")
        .eq("article_id", article_id)
        .eq("session_id", session_id)
        .maybeSingle();

      userLiked = !!userLike;
    }

    return NextResponse.json({
      likeCount,
      userLiked,
    });
  } catch (error) {
    console.error("Like GET error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
