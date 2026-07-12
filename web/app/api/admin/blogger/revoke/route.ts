import { createClient } from "@supabase/supabase-js";

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

    // Get blogger ID
    const { blogger_id } = await request.json();

    if (!blogger_id) {
      return Response.json(
        { error: "Blogger ID required" },
        { status: 400 }
      );
    }

    // Revoke blogger
    const { error: revokeError } = await supabase
      .from("news_bloggers")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("id", blogger_id);

    if (revokeError) {
      return Response.json(
        { error: `Failed to revoke blogger: ${revokeError.message}` },
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      message: "Blogger credentials revoked",
    });
  } catch (error) {
    console.error("Blogger revoke error:", error);
    return Response.json(
      { error: "Failed to revoke blogger" },
      { status: 500 }
    );
  }
}
