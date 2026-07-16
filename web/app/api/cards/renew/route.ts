import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateWaspCardPass } from "@/lib/wallet-pass-generator";

/**
 * POST /api/cards/renew
 * Called when user taps YES in wallet to renew their card
 * Extends card expiration by 1 year and returns updated pass
 */
export async function POST(request: NextRequest) {
  try {
    const { code, token } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Card code required" },
        { status: 400 }
      );
    }

    // Verify the user's card exists and is active
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
        { error: "Only approved members can renew" },
        { status: 403 }
      );
    }

    // Calculate new expiration (1 year from now)
    const newExpiresAt = new Date();
    newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);

    // Update the card expiration in database
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq("id", userProfile.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to renew card" },
        { status: 500 }
      );
    }

    // Generate updated pass with new expiration
    const passBuffer = await generateWaspCardPass({
      cardNumber: userProfile.unique_membership_code,
      userName: userProfile.nickname || userProfile.email,
      associationName: userProfile.associations?.name || "WASP",
      associationCity: userProfile.associations?.city || "Italy",
      userEmail: userProfile.email,
      issuedAt: new Date(userProfile.expires_at || new Date()),
      expiresAt: newExpiresAt,
    });

    // Return the updated pass file
    return new NextResponse(passBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${code}.pkpass"`,
      },
    });
  } catch (error) {
    console.error("Card renewal error:", error);
    return NextResponse.json(
      { error: "Failed to process renewal" },
      { status: 500 }
    );
  }
}
