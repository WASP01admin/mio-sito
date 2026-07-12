import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Verify admin
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    const userId = decoded.sub || decoded.user_id;

    // Check if admin
    const { data: user, error: userError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || user?.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    // Get request body
    const { email, name, blog_url, bio } = await request.json();

    if (!email || !name) {
      return Response.json(
        { error: "Email and name required" },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create blogger entry
    const { data: blogger, error: createError } = await supabase
      .from("news_bloggers")
      .insert({
        email,
        name,
        blog_url: blog_url || null,
        bio: bio || null,
        password_hash: passwordHash,
        created_by: userId,
      })
      .select()
      .single();

    if (createError) {
      return Response.json(
        { error: `Failed to create blogger: ${createError.message}` },
        { status: 400 }
      );
    }

    // TODO: Send email to blogger with login credentials
    // For now, return the temp password so admin can communicate it
    return Response.json({
      success: true,
      blogger: {
        id: blogger.id,
        email: blogger.email,
        name: blogger.name,
      },
      tempPassword, // Admin should send this via email
      message: "Please send the temporary password to the blogger via email",
    });
  } catch (error) {
    console.error("Blogger invite error:", error);
    return Response.json(
      { error: "Failed to invite blogger" },
      { status: 500 }
    );
  }
}
