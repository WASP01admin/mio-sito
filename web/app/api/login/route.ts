import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPassword, createSessionToken, ASSOCIATION_SESSION_COOKIE } from "@/lib/association-auth";
import * as bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

function isAssociationCode(input: string): boolean {
  // Association codes format: ITA1234 (3 letters + 4 digits)
  return /^[A-Z]{3}\d{4}$/.test(input);
}

function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing username or password" },
        { status: 400 }
      );
    }

    // Determine login type by username format
    if (isAssociationCode(username)) {
      // Association login
      return handleAssociationLogin(username, password);
    } else if (isEmail(username)) {
      // Blogger login
      return handleBloggerLogin(username, password);
    } else {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

async function handleAssociationLogin(code: string, password: string) {
  // Look up association by code
  const { data: association, error } = await supabaseAdmin
    .from("associations")
    .select("id, code, name, password")
    .eq("code", code)
    .single();

  if (error || !association) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Verify password (plain text comparison for now)
  if (!association.password || association.password !== password) {
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
    userType: "association",
    redirectTo: "/private-area/dashboard",
  });

  response.cookies.set({
    name: ASSOCIATION_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  response.cookies.set({
    name: "association_code",
    value: association.code,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  response.cookies.set({
    name: "wasp_association_id",
    value: association.id,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return response;
}

async function handleBloggerLogin(email: string, password: string) {
  // Look up blogger by email
  const { data: blogger, error } = await supabaseAdmin
    .from("news_bloggers")
    .select("id, name, email, blog_url, status, password_hash")
    .eq("email", email)
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

  // Generate JWT token for blogger
  const jwtToken = await new SignJWT({
    sub: blogger.id,
    email: blogger.email,
    name: blogger.name,
    type: "blogger",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  // Set cookies for blogger
  const response = NextResponse.json({
    ok: true,
    message: `Welcome ${blogger.name}!`,
    userType: "blogger",
    redirectTo: "/blogger/dashboard",
  });

  response.cookies.set({
    name: "blogger_token",
    value: jwtToken,
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
}
