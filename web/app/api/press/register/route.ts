import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resend, RESEND_FROM } from "@/lib/resend";
import { generateToken } from "@/lib/membership-code";

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

function generatePressCode(): string {
  // Generate unique code like ITA0001, ITA0002, etc.
  const num = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ITA${num}`;
}

function generatePassword(): string {
  // Generate a random password: 12 characters mix of uppercase, lowercase, numbers
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  try {
    const { publisher_name, email, country } = await request.json();

    if (!publisher_name || !email || !country) {
      return NextResponse.json(
        { error: "Publisher name, email, and country required" },
        { status: 400 }
      );
    }

    // Validate country code format (3 letters)
    if (!/^[A-Z]{3}$/.test(country)) {
      return NextResponse.json(
        { error: "Country must be a 3-letter code (e.g., ITA)" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from("press")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate unique press code
    let pressCode = generatePressCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: codeExists } = await supabaseAdmin
        .from("press")
        .select("id")
        .eq("code", pressCode)
        .maybeSingle();

      if (!codeExists) break;
      pressCode = generatePressCode();
      attempts++;
    }

    if (attempts === 10) {
      return NextResponse.json(
        { error: "Failed to generate unique code" },
        { status: 500 }
      );
    }

    // Generate verification token and unique password
    const verificationToken = generateToken();
    const generatedPassword = generatePassword();
    const expiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    ).toISOString();

    // Create press record (unverified)
    const { data: pressRecord, error: createError } = await supabaseAdmin
      .from("press")
      .insert({
        code: pressCode,
        name: publisher_name,
        email: email.toLowerCase(),
        country: country,
        password: generatedPassword,
        verified: false,
        verification_token: verificationToken,
        token_expires_at: expiresAt,
      })
      .select()
      .single();

    if (createError) {
      console.error("Press creation error:", createError);

      // Check if it's a unique constraint violation on the name field
      if (createError.code === "23505" || createError.message?.includes("press_name_unique")) {
        return NextResponse.json(
          { error: "Publisher name already in use. Please choose a different name." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create press record" },
        { status: 500 }
      );
    }

    // Send verification email
    const verifyUrl = `${siteUrl()}/api/press/verify-email?token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: email,
        subject: "Verifica il tuo account Publisher - WASP News",
        html: `
          <h2>Benvenuto su WASP News!</h2>
          <p>Ciao ${publisher_name},</p>
          <p>Grazie per esserti registrato come publisher. Clicca il link qui sotto per verificare il tuo account:</p>
          <p>
            <a href="${verifyUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verifica il tuo account
            </a>
          </p>
          <p>Se non riesci a cliccare il link, copia e incolla questo URL nel tuo browser:</p>
          <p>${verifyUrl}</p>
          <p>Questo link scade tra ${VERIFICATION_TOKEN_EXPIRY_HOURS} ore.</p>

          <hr style="margin: 20px 0;">

          <h3>Le tue credenziali di accesso:</h3>
          <p><strong>Press Code:</strong> ${pressCode}</p>
          <p><strong>Password:</strong> ${generatedPassword}</p>
          <p style="font-size: 12px; color: #666;">Salva queste credenziali in un posto sicuro. Potrai cambiarle dopo il login.</p>

          <p>A presto!</p>
        `,
      });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Delete the record if email send fails
      await supabaseAdmin.from("press").delete().eq("id", pressRecord.id);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
      email,
    });
  } catch (error) {
    console.error("Press registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
