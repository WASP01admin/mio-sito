import { createClient } from "@supabase/supabase-js";
import { generateGoogleWalletJwt, getGoogleWalletSaveUrl } from "@/lib/google-wallet-jwt";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return Response.json({ ok: false, error: "missing_code" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("card_number", code)
      .single();

    if (error || !user) {
      return Response.json({ ok: false, error: "Card not found" }, { status: 404 });
    }

    const jwt = await generateGoogleWalletJwt({
      cardNumber: code,
      userName: user.nickname || user.email,
      issuedAt: new Date(),
      expiresAt: new Date(user.card_expires_at || Date.now() + 48 * 60 * 60 * 1000),
      associationName: "WASP",
      associationCity: "Italy",
      userEmail: user.email,
    });

    const saveUrl = getGoogleWalletSaveUrl(jwt);
    return Response.json({ ok: true, saveUrl }, { status: 200 });
  } catch (error) {
    console.error("Wallet link error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
