import { createClient } from "@supabase/supabase-js";
import { generateCardNumber, calculateCardExpiration } from "@/lib/card-generator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CardRequestBody {
  userId: string;
  requestType: "associated" | "direct";
  paymentId?: string;
}

export async function POST(request: Request) {
  try {
    const { userId, requestType, paymentId } = (await request.json()) as CardRequestBody;

    if (!userId || !requestType) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from("user_profiles")
      .select("id, association_id, card_number, card_status")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // For "associated" type, verify user is confirmed by an association
    if (requestType === "associated") {
      if (!user.association_id) {
        return Response.json(
          { error: "User must be associated with an association to request a free card" },
          { status: 403 }
        );
      }

      // Verify association exists and is active
      const { data: assoc, error: assocError } = await supabase
        .from("associations")
        .select("code")
        .eq("id", user.association_id)
        .single();

      if (assocError || !assoc) {
        return Response.json({ error: "Association not found" }, { status: 404 });
      }

      // Generate card number using association code
      const cardNumber = generateCardNumber(assoc.code);
      const issuedAt = new Date();
      const expiresAt = calculateCardExpiration(issuedAt);

      // Update or create card
      const { data: updatedUser, error: updateError } = await supabase
        .from("user_profiles")
        .update({
          card_number: cardNumber,
          card_issued_at: issuedAt.toISOString(),
          card_expires_at: expiresAt.toISOString(),
          card_status: "active",
          card_request_type: "associated",
          card_payment_id: null,
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) throw updateError;

      return Response.json({
        ok: true,
        card: {
          number: cardNumber,
          issuedAt: issuedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: "active",
          type: "associated",
        },
      });
    }

    // For "direct" type, payment is required
    if (requestType === "direct") {
      if (!paymentId) {
        return Response.json({ error: "Payment ID required for direct card request" }, { status: 400 });
      }

      // TODO: Verify payment with payment processor (Stripe, etc.)
      // For now, we assume payment is verified by the caller

      // Generate card number (WASP association code)
      const waspAssocCode = "WASP0000"; // WASP direct card code
      const cardNumber = generateCardNumber(waspAssocCode);
      const issuedAt = new Date();
      const expiresAt = calculateCardExpiration(issuedAt);

      const { data: updatedUser, error: updateError } = await supabase
        .from("user_profiles")
        .update({
          card_number: cardNumber,
          card_issued_at: issuedAt.toISOString(),
          card_expires_at: expiresAt.toISOString(),
          card_status: "active",
          card_request_type: "direct",
          card_payment_id: paymentId,
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) throw updateError;

      return Response.json({
        ok: true,
        card: {
          number: cardNumber,
          issuedAt: issuedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
          status: "active",
          type: "direct",
        },
      });
    }

    return Response.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Error requesting card:", error);
    return Response.json({ error: "Failed to request card" }, { status: 500 });
  }
}
