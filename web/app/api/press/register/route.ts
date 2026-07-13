import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resend, RESEND_FROM } from "@/lib/resend";
import { generateToken } from "@/lib/membership-code";

const PRESS_PASSWORD = "press123"; // Same password for all press orgs
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

function generatePressCode(): string {
  // Generate unique code like ITA0001, ITA0002, etc.
  const num = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ITA${num}`;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  try {
    const { publisher_name, email } = await request.json();

    if (!publisher_name || !email) {
      return NextResponse.json(
        { error: "Publisher name and email required" },
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

    // Generate verification token
    const verificationToken = generateToken();
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
        password: PRESS_PASSWORD,
        verified: false,
        verification_token: verificationToken,
        token_expires_at: expiresAt,
      })
      .select()
      .single();

    if (createError) {
      console.error("Press creation error:", createError);
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
