import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return Response.json(
        { ok: false, error: "missing_token" },
        { status: 400 }
      );
    }

    // Find the card with this verification token
    const { data: card, error: queryError } = await supabase
      .from("business_cards")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (queryError || !card) {
      return Response.json(
        { ok: false, error: "invalid_token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (card.verification_token_expires_at) {
      const expiresAt = new Date(card.verification_token_expires_at);
      if (expiresAt < new Date()) {
        return Response.json(
          { ok: false, error: "expired_token" },
          { status: 400 }
        );
      }
    }

    // Update card: mark as verified and set status to active
    const { error: updateError } = await supabase
      .from("business_cards")
      .update({
        email_verified: true,
        verified_at: new Date().toISOString(),
        status: "active",
        verification_token: null,
        verification_token_expires_at: null,
      })
      .eq("id", card.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return Response.json(
        { ok: false, error: "server_error" },
        { status: 500 }
      );
    }

    // Redirect to success page with locale (default to /it)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const locale = "it"; // Default locale, could be extracted from request headers if needed
    const successUrl = new URL(appUrl);
    successUrl.pathname = `/${locale}/business-card-verified`;
    successUrl.searchParams.set("cardId", card.card_id);

    return Response.redirect(successUrl.toString(), 302);
  } catch (error) {
    console.error("Verification error:", error);
    return Response.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
