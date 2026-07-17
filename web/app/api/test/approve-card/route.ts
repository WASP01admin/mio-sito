import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Temporary test endpoint to approve a card
 * Remove this in production!
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ membership_status: "approved" })
      .eq("unique_membership_code", code);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Card ${code} approved!` });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
