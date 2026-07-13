import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET: Fetch all news (associations + press articles)
export async function GET(request: NextRequest) {
  try {
    // Get association news
    const { data: assocNews, error: assocError } = await supabaseAdmin
      .from("association_news")
      .select("id, title:headline, description, image_url, created_at, published_date, original_source, associations:association_id(code, name)")
      .order("created_at", { ascending: false });

    if (assocError) {
      console.error("Association news error:", assocError);
    }

    // Get press articles with press info
    const { data: pressArticles, error: pressError } = await supabaseAdmin
      .from("press_articles")
      .select("id, title, content, image_url, created_at, published_date, press:press_id(code, name)")
      .order("created_at", { ascending: false });

    if (pressError) {
      console.error("Press articles error:", pressError);
    }

    // Transform press articles to match association news format
    const enhancedPressArticles = (pressArticles || []).map((article: any) => ({
      id: article.id,
      headline: article.title,
      description: article.content,
      image_url: article.image_url,
      created_at: article.created_at,
      published_date: article.published_date,
      original_source: null,
      associations: article.press,
    }));

    // Combine and sort by date
    const allNews = [...(assocNews || []), ...enhancedPressArticles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(allNews);
  } catch (error) {
    console.error("Error fetching all news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
