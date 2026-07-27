import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { resend, RESEND_FROM } from "@/lib/resend";
import { businessCardVerificationEmail } from "@/lib/email-templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate random alphanumeric string (5 characters)
function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate unique card ID
async function generateUniqueCardId(countryCode: string): Promise<string> {
  let cardId: string;
  let exists = true;

  while (exists) {
    const randomCode = generateRandomCode();
    cardId = `${countryCode.toUpperCase()}-BIZ-${randomCode}`;

    const { data } = await supabase
      .from("business_cards")
      .select("id")
      .eq("card_id", cardId)
      .limit(1);

    exists = (data?.length ?? 0) > 0;
  }

  return cardId!;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const nickname = formData.get("nickname") as string;
    const countryCode = formData.get("countryCode") as string;
    const businessName = formData.get("businessName") as string;
    const partitaIva = formData.get("partitaIva") as string;
    const email = formData.get("email") as string;
    const photo = formData.get("photo") as File | null;

    // Validation
    if (!nickname || !countryCode || !businessName || !partitaIva || !email) {
      return Response.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }

    if (countryCode.length !== 3) {
      return Response.json(
        { ok: false, error: "invalid_country_code" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("business_cards")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      return Response.json(
        { ok: false, error: "email_already_registered" },
        { status: 400 }
      );
    }

    // Generate unique card ID
    const cardId = await generateUniqueCardId(countryCode);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Upload photo if provided
    let photoUrl: string | null = null;
    if (photo && photo.size > 0) {
      const fileName = `${crypto.randomBytes(8).toString("hex")}_${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("business-card-photos")
        .upload(`${cardId}/${fileName}`, photo);

      if (uploadError) {
        console.error("Photo upload error:", uploadError);
        return Response.json(
          { ok: false, error: "photo_upload_failed" },
          { status: 500 }
        );
      }

      photoUrl = uploadData?.path || null;
    }

    // Insert business card record
    const { data: newCard, error: insertError } = await supabase
      .from("business_cards")
      .insert({
        card_id: cardId,
        nickname,
        country_code: countryCode.toUpperCase(),
        business_name: businessName,
        partita_iva: partitaIva,
        email,
        photo_url: photoUrl,
        status: "pending",
        verification_token: verificationToken,
        verification_token_expires_at: tokenExpiry,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return Response.json(
        { ok: false, error: "server_error" },
        { status: 500 }
      );
    }

    // Send verification email
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/business-cards/verify?token=${verificationToken}`;
    const { subject, html } = businessCardVerificationEmail({
      nickname,
      businessName,
      cardId: cardId,
      verificationUrl: verificationLink,
    });

    try {
      await resend.emails.send({ from: RESEND_FROM, to: email, subject, html });
    } catch (error) {
      console.error("Failed to send verification email:", error);
      return Response.json(
        { ok: false, error: "email_send_failed" },
        { status: 500 }
      );
    }

    return Response.json(
      {
        ok: true,
        message: "verification_email_sent",
        cardId: newCard?.card_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
