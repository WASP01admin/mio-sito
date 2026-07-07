import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword, createSessionToken, ASSOCIATION_SESSION_COOKIE } from "@/lib/association-auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing username or password" },
        { status: 400 }
      );
    }

    // Look up association by code (7-digit format: ITA0125)
    const { data: association, error } = await supabaseAdmin
      .from("associations")
      .select("id, code, name, password_hash")
      .eq("code", username)
      .single();

    if (error || !association) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    if (!association.password_hash || !verifyPassword(password, association.password_hash)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login
    await supabaseAdmin
      .from("associations")
      .update({ last_login: new Date().toISOString() })
      .eq("id", association.id);

    // Create session token
    const token = createSessionToken();

    // Set cookies
    const response = NextResponse.json({
      ok: true,
      message: `Welcome ${association.name}!`,
    });

    response.cookies.set({
      name: ASSOCIATION_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Also set association ID for API requests
    response.cookies.set({
      name: "wasp_association_id",
      value: association.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
