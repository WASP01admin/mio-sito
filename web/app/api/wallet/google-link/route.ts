import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateGoogleWalletJwt, getGoogleWalletSaveUrl } from "@/lib/google-wallet-jwt";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Card code required" }, { status: 400 });
    }

    // Look up card in database
    const { data: user, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, nickname, email, unique_membership_code, expires_at, associations(name)")
      .eq("unique_membership_code", code)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const association = Array.isArray(user.associations)
      ? user.associations[0]
      : user.associations;

    // Generate JWT and get save URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waspnest.org";
    const jwt = await generateGoogleWalletJwt({
      cardNumber: code,
      userName: user.nickname || user.email,
      issuedAt: new Date(),
      expiresAt: new Date(user.expires_at || Date.now() + 48 * 60 * 60 * 1000),
      associationName: association?.name || "WASP",
      associationCity: "Italy",
      userEmail: user.email,
    });

    const saveUrl = getGoogleWalletSaveUrl(jwt);

    // Log full payload for debugging
    console.log("=== GOOGLE WALLET DEBUG ===");
    console.log("Card Code:", code);
    console.log("Save URL:", saveUrl);
    console.log("JWT:", jwt);
    console.log("========================");

    // Return debug info for support ticket
    return NextResponse.json({
      url: saveUrl,
      debug: {
        jwt,
        passData: {
          cardNumber: code,
          userName: user.nickname || user.email,
          associationName: association?.name || "WASP",
          userEmail: user.email,
          expiresAt: new Date(user.expires_at || Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        }
      }
    });
  } catch (error) {
    console.error("Google Wallet JWT error:", error);
    return NextResponse.json({ error: "Failed to generate wallet link" }, { status: 500 });
  }
}
