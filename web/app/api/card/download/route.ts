import { createClient } from "@supabase/supabase-js";
import { generateWaspCardPass } from "@/lib/wallet-pass-generator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Get auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token and get user ID
    // TODO: Implement proper JWT verification
    const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    const userId = decoded.sub || decoded.user_id;

    if (!userId) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user and card info
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select(
        `
        id,
        nickname,
        card_number,
        card_issued_at,
        card_expires_at,
        card_status,
        card_request_type,
        associations (name)
      `
      )
      .eq("id", userId)
      .single();

    if (error || !user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a valid card
    if (!user.card_number || user.card_status !== "active") {
      return Response.json({ error: "No active card found" }, { status: 404 });
    }

    // Generate wallet pass
    const passBuffer = await generateWaspCardPass({
      cardNumber: user.card_number,
      userName: user.nickname || "WASP Member",
      issuedAt: new Date(user.card_issued_at),
      expiresAt: new Date(user.card_expires_at),
      type: user.card_request_type as "associated" | "direct",
      associationName: user.associations?.name,
      userImageUrl: user.photo_url || undefined,
    });

    // Return pass file
    return new Response(passBuffer, {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="WASP-${user.card_number}.pkpass"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error downloading card pass:", error);
    return Response.json({ error: "Failed to generate pass" }, { status: 500 });
  }
}
