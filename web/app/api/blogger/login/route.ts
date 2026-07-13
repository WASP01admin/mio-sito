import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import * as bcrypt from "bcryptjs";
import { SignJWT } from "jose";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Look up blogger by email (case-insensitive)
    const { data: blogger, error } = await supabaseAdmin
      .from("news_bloggers")
      .select("id, name, email, bio, blog_url, status, password_hash")
      .ilike("email", email)
      .eq("status", "active")
      .single();

    if (error || !blogger) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, blogger.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await new SignJWT({
      sub: blogger.id,
      email: blogger.email,
      name: blogger.name,
      type: "blogger",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      message: `Welcome ${blogger.name}!`,
      token,
      blogger: {
        id: blogger.id,
        name: blogger.name,
        email: blogger.email,
        bio: blogger.bio,
        blog_url: blogger.blog_url,
      },
    });

    // Set cookie for session
    response.cookies.set({
      name: "blogger_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    response.cookies.set({
      name: "blogger_id",
      value: blogger.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
      token,
      blogger: {
        id: blogger.id,
        name: blogger.name,
        email: blogger.email,
    console.error("Blogger login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
