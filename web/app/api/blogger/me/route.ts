import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get blogger_id from cookie
    const bloggerId = request.cookies.get("blogger_id")?.value;

    if (!bloggerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch blogger info
    const { data: blogger, error } = await supabaseAdmin
      .from("news_bloggers")
      .select("id, name, email, blog_url, bio, status")
      .eq("id", bloggerId)
      .eq("status", "active")
      .single();

    if (error || !blogger) {
      return NextResponse.json(
        { error: "Blogger not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      blogger: {
        id: blogger.id,
        name: blogger.name,
        email: blogger.email,
        blog_url: blogger.blog_url,
        bio: blogger.bio,
      },
    });
  } catch (error) {
    console.error("Error fetching blogger:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogger" },
      { status: 500 }
    );
  }
}
