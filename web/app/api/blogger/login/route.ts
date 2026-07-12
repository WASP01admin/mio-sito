import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Get blogger by email
    const { data: blogger, error } = await supabase
      .from("news_bloggers")
      .select("id, name, email, blog_url, bio, status, password_hash")
      .eq("email", email)
      .eq("status", "active")
      .single();

    if (error || !blogger) {
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, blogger.password_hash);
    if (!passwordMatch) {
      return Response.json(
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

    return Response.json({
      success: true,
      token,
      blogger: {
        id: blogger.id,
        name: blogger.name,
        email: blogger.email,
        bio: blogger.bio,
        blog_url: blogger.blog_url,
      },
    });
  } catch (error) {
    console.error("Blogger login error:", error);
    return Response.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
