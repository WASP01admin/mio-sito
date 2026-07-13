import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resend, RESEND_FROM } from "@/lib/resend";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    // Find press record by verification token
    const { data: pressRecord, error: queryError } = await supabaseAdmin
      .from("press")
      .select("id, code, name, email, password, token_expires_at, verified")
      .eq("verification_token", token)
      .maybeSingle();

    if (queryError) {
      console.error("Press verification lookup error:", queryError);
      return NextResponse.redirect(
        `${siteUrl()}/it/registrati?error=server_error`
      );
    }

    if (!pressRecord) {
      return NextResponse.redirect(
        `${siteUrl()}/it/registrati?error=invalid_token`
      );
    }

    // Check if already verified
    if (pressRecord.verified) {
      return NextResponse.redirect(
        `${siteUrl()}/it/registrati?error=already_verified`
      );
    }

    // Check if token expired
    const expiresAt = pressRecord.token_expires_at
      ? new Date(pressRecord.token_expires_at)
      : null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      return NextResponse.redirect(
        `${siteUrl()}/it/registrati?error=expired_token`
      );
    }

    // Mark as verified
    const { error: updateError } = await supabaseAdmin
      .from("press")
      .update({
        verified: true,
        verification_token: null,
        token_expires_at: null,
        last_login: new Date().toISOString(),
      })
      .eq("id", pressRecord.id);

    if (updateError) {
      console.error("Press verification update error:", updateError);
      return NextResponse.redirect(
        `${siteUrl()}/it/registrati?error=server_error`
      );
    }

    // Send credentials email
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: pressRecord.email,
        subject: "Le tue credenziali per WASP News Publisher",
        html: `
          <h2>Account verificato! 🎉</h2>
          <p>Ciao ${pressRecord.name},</p>
          <p>Il tuo account è stato verificato con successo! Puoi ora accedere a WASP News Publisher.</p>

          <h3>Le tue credenziali di accesso:</h3>
          <p>
            <strong>Codice Publisher:</strong> <code style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${pressRecord.code}</code><br>
            <strong>Password:</strong> <code style="background-color: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${pressRecord.password}</code>
          </p>

          <p>
            <a href="${siteUrl()}/it/news" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accedi al tuo account
            </a>
          </p>

          <p style="font-size: 12px; color: #666;">
            Non condividere queste credenziali con nessuno. Se non hai richiesto questo account, contattaci immediatamente.
          </p>
        `,
      });
    } catch (emailError) {
      console.error("Credentials email send error:", emailError);
      // Verification was successful, email issue is non-critical
    }

    // Redirect to news page with success message
    return NextResponse.redirect(
      `${siteUrl()}/it/news?publisher_verified=true&code=${encodeURIComponent(
        pressRecord.code
      )}&email=${encodeURIComponent(pressRecord.email)}`
    );
  } catch (error) {
    console.error("Press email verification error:", error);
    return NextResponse.redirect(
      `${siteUrl()}/it/registrati?error=server_error`
    );
  }
}
