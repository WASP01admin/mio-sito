import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

async function verifyBloggerToken(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload;
  } catch {
    return null;
  }
}

// GET: Fetch blogger's articles
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyBloggerToken(token);

    if (!payload || payload.type !== "blogger") {
      return Response.json({ error: "Invalid blogger token" }, { status: 401 });
    }

    const bloggerId = payload.sub as string;

    // Get blogger's articles
    const { data: articles, error } = await supabase
      .from("association_news")
      .select("id, title, content, created_at, image_url, published_date")
      .eq("blogger_id", bloggerId)
      .eq("author_type", "blogger")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ articles });
  } catch (error) {
    console.error("Error fetching blogger news:", error);
    return Response.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST: Create new article (no original_source)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyBloggerToken(token);

    if (!payload || payload.type !== "blogger") {
      return Response.json({ error: "Invalid blogger token" }, { status: 401 });
    }

    const bloggerId = payload.sub as string;
    const { title, content, image_url, published_date } = await request.json();

    if (!title || !content) {
      return Response.json(
        { error: "Title and content required" },
        { status: 400 }
      );
    }

    // Create article
    const { data: article, error } = await supabase
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
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
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
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyBloggerToken(token);

    if (!payload || payload.type !== "blogger") {
      return Response.json({ error: "Invalid blogger token" }, { status: 401 });
    }

    const bloggerId = payload.sub as string;
    const { id, title, content, image_url, published_date } = await request.json();

    if (!id) {
      return Response.json({ error: "Article ID required" }, { status: 400 });
    }

    // Verify ownership
    const { data: article, error: fetchError } = await supabase
      .from("association_news")
      .select("blogger_id")
      .eq("id", id)
      .single();

    if (fetchError || !article || article.blogger_id !== bloggerId) {
      return Response.json(
        { error: "Not authorized to edit this article" },
        { status: 403 }
      );
    }

    // Update article
    const { data: updated, error: updateError } = await supabase
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
      return Response.json({ error: updateError.message }, { status: 400 });
    }

    return Response.json({ success: true, article: updated });
  } catch (error) {
    console.error("Error updating article:", error);
    return Response.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE: Delete article
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyBloggerToken(token);

    if (!payload || payload.type !== "blogger") {
      return Response.json({ error: "Invalid blogger token" }, { status: 401 });
    }

    const bloggerId = payload.sub as string;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Article ID required" }, { status: 400 });
    }

    // Verify ownership
    const { data: article, error: fetchError } = await supabase
      .from("association_news")
      .select("blogger_id")
      .eq("id", id)
      .single();

    if (fetchError || !article || article.blogger_id !== bloggerId) {
      return Response.json(
        { error: "Not authorized to delete this article" },
        { status: 403 }
      );
    }

    // Delete article
    const { error: deleteError } = await supabase
      .from("association_news")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return Response.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
