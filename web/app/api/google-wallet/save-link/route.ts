import { createClient } from "@supabase/supabase-js";
import { generateGoogleWalletJwt, getGoogleWalletSaveUrl } from "@/lib/google-wallet-jwt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");

    if (!cardId) {
      return Response.json(
        { ok: false, error: "missing_cardId" },
        { status: 400 }
      );
    }

    // Fetch card from database
    const { data: card, error: queryError } = await supabase
      .from("business_cards")
      .select("*")
      .eq("card_id", cardId)
      .single();

    if (queryError || !card) {
      return Response.json(
        { ok: false, error: "card_not_found" },
        { status: 404 }
      );
    }

    // Generate JWT for Google Wallet
    const expiresDate = new Date(card.created_at);
    expiresDate.setFullYear(expiresDate.getFullYear() + 5);

    const jwt = await generateGoogleWalletJwt({
      cardNumber: card.card_id,
      userName: card.nickname,
      issuedAt: new Date(card.created_at),
      expiresAt: expiresDate,
      associationName: "Amici degli Animali",
      associationCity: card.country_code,
      userEmail: card.email,
      photoUrl: card.photo_url,
    });

    // Get the save URL
    const saveUrl = getGoogleWalletSaveUrl(jwt);

    return Response.json(
      { ok: true, saveUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google Wallet save link error:", error);
    return Response.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
