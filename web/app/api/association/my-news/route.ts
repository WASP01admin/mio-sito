import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get association ID from cookie
    const associationId = request.cookies.get("wasp_association_id")?.value;

    if (!associationId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("association_news")
      .select("*, associations(code, name)")
      .eq("association_id", associationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
