import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    // Note: This endpoint is read-only and safe. Modify/delete actions require proper auth.

    // Get all press organizations with article count
    const { data: pressOrgs, error: queryError } = await supabaseAdmin
      .from("press")
      .select(
        `
        id,
        code,
        name,
        email,
        verified,
        password,
        created_at,
        last_login,
        press_articles(count)
      `
      )
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Press list error:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch press organizations" },
        { status: 500 }
      );
    }

    // Transform response
    const enhanced = (pressOrgs || []).map((org: any) => ({
      id: org.id,
      code: org.code,
      name: org.name,
      email: org.email,
      verified: org.verified,
      password: org.password,
      articles_count: org.press_articles?.[0]?.count || 0,
      created_at: org.created_at,
      last_login: org.last_login,
    }));

    return NextResponse.json({ publishers: enhanced });
  } catch (error) {
    console.error("Admin press list error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
