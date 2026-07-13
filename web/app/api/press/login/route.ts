import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { code, password } = await request.json();

    if (!code || !password) {
      return NextResponse.json(
        { error: "Code and password required" },
        { status: 400 }
      );
    }

    // Look up press by code
    const { data: pressOrg, error } = await supabaseAdmin
      .from("press")
      .select("id, code, name, password, verified")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !pressOrg) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    if (!pressOrg.password || pressOrg.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if verified
    if (!pressOrg.verified) {
      return NextResponse.json(
        { error: "Press organization not verified" },
        { status: 403 }
      );
    }

    // Update last login
    await supabaseAdmin
      .from("press")
      .update({ last_login: new Date().toISOString() })
      .eq("id", pressOrg.id);

    // Return press info
    return NextResponse.json({
      success: true,
      press_id: pressOrg.id,
      press_code: pressOrg.code,
      press_name: pressOrg.name,
    });
  } catch (error) {
    console.error("Press login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
