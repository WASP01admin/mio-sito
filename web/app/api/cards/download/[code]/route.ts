import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateWaspCardPass } from "@/lib/wallet-pass-generator";

/**
 * GET /api/cards/download/[code]
 * Download a wallet pass (.pkpass) file for a specific card code
 * Works for both Apple Wallet (iOS) and Google Wallet (Android)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: "Card code required" },
        { status: 400 }
      );
    }

    // Fetch card details from database
    const { data: userProfile, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select(
        `
        id,
        unique_membership_code,
        nickname,
        email,
        expires_at,
        membership_status,
        created_at,
        associations(name, city)
      `
      )
      .eq("unique_membership_code", code)
      .single();

    if (fetchError || !userProfile) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    if (userProfile.membership_status !== "approved") {
      return NextResponse.json(
        { error: "Card is not approved yet" },
        { status: 403 }
      );
    }

    // Generate wallet pass (.pkpass file)
    const passBuffer = await generateWaspCardPass({
      cardNumber: userProfile.unique_membership_code,
      userName: userProfile.nickname || userProfile.email,
      associationName: userProfile.associations?.[0]?.name || "WASP",
      associationCity: userProfile.associations?.[0]?.city || "Italy",
      userEmail: userProfile.email,
      issuedAt: new Date(userProfile.created_at),
      expiresAt: new Date(userProfile.expires_at || new Date()),
    });

    // Return as downloadable file
    return new NextResponse(passBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${code}.pkpass"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Card download error:", error);
    return NextResponse.json(
      { error: "Failed to generate card" },
      { status: 500 }
    );
  }
}
