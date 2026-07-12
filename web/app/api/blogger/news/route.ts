import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET: Fetch blogger's articles
export async function GET(request: NextRequest) {
  try {
    const bloggerId = request.cookies.get("blogger_id")?.value;

    if (!bloggerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get blogger's articles
    const { data: articles, error } = await supabaseAdmin
      .from("association_news")
      .select("id, title, content, created_at, image_url, published_date")
      .eq("blogger_id", bloggerId)
      .eq("author_type", "blogger")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching blogger news:", error);
    return Response.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST: Create new article (no original_source)
export async function POST(request: NextRequest) {
  try {
    const bloggerId = request.cookies.get("blogger_id")?.value;

    if (!bloggerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content, image_url, published_date } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    // Create article
    const { data: article, error } = await supabaseAdmin
      .from("association_news")
      .insert({
        title,
        content,
        image_url: image_url || null,
        published_date: published_date || new Date().toISOString().split("T")[0],
        author_type: "blogger",
        blogger_id: bloggerId,
        // Note: NO original_source field - bloggers are the source
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, article },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating article:", error);
    return Response.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

// PUT: Update article
export async function PUT(request: NextRequest) {
  try {
    const bloggerId = request.cookies.get("blogger_id")?.value;

    if (!bloggerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, content, image_url, published_date } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    // Verify ownership
    const { data: article, error: fetchError } = await supabaseAdmin
      .from("association_news")
      .select("blogger_id")
      .eq("id", id)
      .single();

    if (fetchError || !article || article.blogger_id !== bloggerId) {
      return NextResponse.json(
        { error: "Not authorized to edit this article" },
        { status: 403 }
      );
    }

    // Update article
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("association_news")
      .update({
        title,
        content,
        image_url: image_url || null,
        published_date: published_date || new Date().toISOString().split("T")[0],
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, article: updated });
  } catch (error) {
    console.error("Error updating article:", error);
    return Response.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE: Delete article
export async function DELETE(request: NextRequest) {
  try {
    const bloggerId = request.cookies.get("blogger_id")?.value;

    if (!bloggerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Article ID required" }, { status: 400 });
    }

    // Verify ownership
    const { data: article, error: fetchError } = await supabaseAdmin
      .from("association_news")
      .select("blogger_id")
      .eq("id", id)
      .single();

    if (fetchError || !article || article.blogger_id !== bloggerId) {
      return NextResponse.json(
        { error: "Not authorized to delete this article" },
        { status: 403 }
      );
    }

    // Delete article
    const { error: deleteError } = await supabaseAdmin
      .from("association_news")
      .delete()
      .eq("id", id);

    if (deleteError) {
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
