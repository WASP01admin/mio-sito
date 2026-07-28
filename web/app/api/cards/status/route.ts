import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/cards/status?code=ITA0001X9F2
 * Check the status of a card (expiration date, validity, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Card code required" },
        { status: 400 }
      );
    }

    // Fetch card details
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
        associations(name, city, code)
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

    // Calculate days until expiry
    const expiresAt = new Date(userProfile.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isExpired = daysUntilExpiry < 0;

    // Determine card status
    let status = "active";
    if (userProfile.membership_status === "rejected") {
      status = "rejected";
    } else if (isExpired) {
      status = "expired";
    } else if (userProfile.membership_status === "pending") {
      status = "pending";
    }

    return NextResponse.json({
      code: userProfile.unique_membership_code,
      status,
      holder: userProfile.nickname || userProfile.email,
      email: userProfile.email,
      association: {
        name: userProfile.associations?.[0]?.name,
        city: userProfile.associations?.[0]?.city,
        code: userProfile.associations?.[0]?.code,
      },
      issued: userProfile.created_at,
      expires: userProfile.expires_at,
      daysUntilExpiry: Math.max(daysUntilExpiry, 0),
      expiryDate: expiresAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      membershipStatus: userProfile.membership_status,
    });
  } catch (error) {
    console.error("Card status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch card status" },
      { status: 500 }
    );
  }
}
