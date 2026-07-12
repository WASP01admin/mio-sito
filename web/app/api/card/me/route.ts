import { createClient } from "@supabase/supabase-js";
import { isCardExpired } from "@/lib/card-generator";

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

    // Get user card info
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("card_number, card_issued_at, card_expires_at, card_status, card_request_type")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if card exists
    if (!user.card_number) {
      return Response.json({ card: null });
    }

    // Check if card is expired
    const expiresAt = new Date(user.card_expires_at);
    const expired = isCardExpired(expiresAt);

    return Response.json({
      card: {
        number: user.card_number,
        issuedAt: user.card_issued_at,
        expiresAt: user.card_expires_at,
        status: expired ? "expired" : user.card_status,
        type: user.card_request_type,
        isExpired: expired,
      },
    });
  } catch (error) {
    console.error("Error fetching card:", error);
    return Response.json({ error: "Failed to fetch card" }, { status: 500 });
  }
}
