import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Convert URLs in text to clickable links (skip URLs already in <a> tags)
function convertUrlsToLinks(text: string): string {
  // First, protect existing <a> tags by replacing them with a placeholder
  const linkPlaceholders: { [key: string]: string } = {};
  let placeholderIndex = 0;

  const protectedText = text.replace(/<a\s+[^>]*href="[^"]*"[^>]*>.*?<\/a>/g, (match) => {
    const placeholder = `__LINK_PLACEHOLDER_${placeholderIndex}__`;
    linkPlaceholders[placeholder] = match;
    placeholderIndex++;
    return placeholder;
  });

  // Now convert bare URLs (not already in links)
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"\)]+/g;
  const withLinks = protectedText.replace(urlRegex, (url) => {
    const href = url.startsWith("http") ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  // Restore original links
  let result = withLinks;
  for (const [placeholder, link] of Object.entries(linkPlaceholders)) {
    result = result.replace(placeholder, link);
  }

  return result;
}

// GET: Fetch press's articles
export async function GET(request: NextRequest) {
  try {
    const pressId = request.headers.get("X-Press-ID");
    const pressCode = request.headers.get("X-Press-Code");

    if (!pressId || !pressCode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify press exists
    const { data: pressOrg } = await supabaseAdmin
      .from("press")
      .select("id")
      .eq("id", pressId)
      .eq("code", pressCode)
      .single();

    if (!pressOrg) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get articles for this press only
    const { data: articles, error } = await supabaseAdmin
      .from("press_articles")
      .select("id, title, content, created_at, image_url, published_date")
      .eq("press_id", pressId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST: Create new article
export async function POST(request: NextRequest) {
  try {
    const pressId = request.headers.get("X-Press-ID");
    const pressCode = request.headers.get("X-Press-Code");

    if (!pressId || !pressCode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify press exists
    const { data: pressOrg } = await supabaseAdmin
      .from("press")
      .select("id, name")
      .eq("id", pressId)
      .eq("code", pressCode)
      .single();

    if (!pressOrg) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, image_url, published_date } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    // Skip auto-linking since Quill editor already handles link formatting
    const contentWithLinks = content;

    // Create article
    const { data: article, error } = await supabaseAdmin
      .from("press_articles")
      .insert({
        press_id: pressId,
        title,
        content: contentWithLinks,
        image_url: image_url || null,
        published_date: published_date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

// DELETE: Delete article
export async function DELETE(request: NextRequest) {
  try {
    const pressId = request.headers.get("X-Press-ID");
    const pressCode = request.headers.get("X-Press-Code");

    if (!pressId || !pressCode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify press exists
    const { data: pressOrg } = await supabaseAdmin
      .from("press")
      .select("id")
      .eq("id", pressId)
      .eq("code", pressCode)
      .single();

    if (!pressOrg) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    // Verify ownership
    const { data: article } = await supabaseAdmin
      .from("press_articles")
      .select("press_id")
      .eq("id", id)
      .single();

    if (!article || article.press_id !== pressId) {
      return NextResponse.json(
        { error: "Not authorized to delete this article" },
        { status: 403 }
      );
    }

    // Delete article
    const { error: deleteError } = await supabaseAdmin
      .from("press_articles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
