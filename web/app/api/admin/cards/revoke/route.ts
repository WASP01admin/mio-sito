import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/admin/cards/revoke
 * Admin endpoint to revoke a card (when user leaves association)
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const { userEmail, reason } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    // TODO: Add authentication check for admin
    // For now, this is open - should verify admin JWT token

    // Find the user profile by email
    const { data: userProfile, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, unique_membership_code, email, membership_status")
      .eq("email", userEmail)
      .single();

    if (fetchError || !userProfile) {
      return NextResponse.json(
        { error: "User card not found" },
        { status: 404 }
      );
    }

    // Check if card is already revoked
    if (userProfile.membership_status === "rejected") {
      return NextResponse.json(
        { error: "Card is already revoked" },
        { status: 400 }
      );
    }

    // Revoke the card by setting membership_status to 'rejected'
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        membership_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userProfile.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to revoke card" },
        { status: 500 }
      );
    }

    // Log the revocation (optional audit trail)
    if (reason) {
      await supabaseAdmin.from("audit_log").insert({
        entity_type: "user_profiles",
        entity_id: userProfile.id,
        field: "membership_status",
        old_value: userProfile.membership_status,
        new_value: "rejected",
      });
    }

    // TODO: Send push notification to card in wallet to update status
    // This would trigger Apple Push Notification Service (APNs)
    // to update the card display in the user's wallet

    return NextResponse.json({
      success: true,
      message: "Card revoked successfully",
      cardCode: userProfile.unique_membership_code,
      userEmail: userProfile.email,
      revokedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Card revocation error:", error);
    return NextResponse.json(
      { error: "Failed to process revocation" },
      { status: 500 }
    );
  }
}
