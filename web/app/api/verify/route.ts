import { NextRequest, NextResponse, userAgent } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateUniqueMembershipCode, generateToken } from "@/lib/membership-code";
import { resolveLocale } from "@/lib/locale";
import { resend, RESEND_FROM } from "@/lib/resend";
import { associationConfirmationEmail } from "@/lib/email-templates";
import { WASP_DIRECT_ASSOCIATION_CODE } from "@/lib/constants";
import { generateWaspCardPass } from "@/lib/wallet-pass-generator";
import { createGoogleWalletObjectOnApi } from "@/lib/google-wallet-jwt";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface AssociationRef {
  code: string;
  name: string;
  email: string | null;
}

interface VerifyRow {
  id: string;
  nickname: string | null;
  email: string;
  token_expires_at: string | null;
  token_purpose: string | null;
  is_verified: boolean;
  associations: AssociationRef | null;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function notifyAssociation(userProfileId: string, association: AssociationRef, memberEmail: string) {
  if (association.code === WASP_DIRECT_ASSOCIATION_CODE) {
    return;
  }

  if (!association.email) {
    console.warn(
      `Verify: association ${association.code} has no email on file, skipping auto-notification for profile ${userProfileId}`
    );
    return;
  }

  try {
    const confirmationToken = generateToken();
    const yesUrl = `${siteUrl()}/api/association-confirm?token=${confirmationToken}&answer=yes`;
    const noUrl = `${siteUrl()}/api/association-confirm?token=${confirmationToken}&answer=no`;

    const { subject, html } = associationConfirmationEmail({
      memberEmail,
      associationName: association.name,
      yesUrl,
      noUrl,
    });
    await resend.emails.send({ from: RESEND_FROM, to: association.email, subject, html });

    const contactedAt = new Date().toISOString();
    await supabaseAdmin
      .from("user_profiles")
      .update({
        association_contacted_at: contactedAt,
        association_confirmation_token: confirmationToken,
      })
      .eq("id", userProfileId);
  } catch (error) {
    console.error("Failed to notify association:", error);
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const locale = resolveLocale(request.nextUrl.searchParams.get("locale"));
  const { device } = userAgent(request);
  const isMobile = device.type === "mobile";
  const base = `${siteUrl()}/${locale}`;

  if (!token) {
    return NextResponse.redirect(`${base}/registrati/errore?reason=missing_token`);
  }

  // Find user without join to avoid join failures
  const { data: userOnly, error: userError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, nickname, email, token_expires_at, token_purpose, is_verified, association_id")
    .eq("verification_token", token)
    .maybeSingle();

  if (userError) {
    console.error("[VERIFY] Lookup failed:", userError);
    return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
  }

  if (!userOnly) {
    console.log("[VERIFY] No profile found with token");
    return NextResponse.redirect(`${base}/registrati/errore?reason=invalid_token`);
  }

  // Fetch association separately
  const { data: assocData, error: assocError } = await supabaseAdmin
    .from("associations")
    .select("code, name, email")
    .eq("id", userOnly.association_id)
    .maybeSingle();

  if (assocError || !assocData) {
    console.error("[VERIFY] Association lookup failed:", assocError);
    return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
  }

  // Check token expiry
  const expiresAt = userOnly.token_expires_at ? new Date(userOnly.token_expires_at) : null;
  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(`${base}/registrati/errore?reason=expired_token`);
  }

  // Handle renewal
  if (userOnly.token_purpose === "renewal") {
    const newExpiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();
    await supabaseAdmin
      .from("user_profiles")
      .update({
        expires_at: newExpiresAt,
        verification_token: null,
        token_expires_at: null,
        token_purpose: null,
      })
      .eq("id", userOnly.id);

    await supabaseAdmin.from("audit_log").insert({
      entity_type: "user_profile",
      entity_id: userOnly.id,
      field: "expires_at",
      old_value: null,
      new_value: newExpiresAt,
    });

    return NextResponse.redirect(`${base}/registrati/successo?renewed=true`);
  }

  // Skip if already verified
  if (userOnly.is_verified) {
    return NextResponse.redirect(`${base}/registrati/successo?mobile=${isMobile}`);
  }

  // Generate membership code and token
  const uniqueCode = await generateUniqueMembershipCode(assocData.code);
  const walletAuthToken = generateToken();
  const tempExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Update user as verified with temporary card
  const { error: verifyError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      is_verified: true,
      unique_membership_code: uniqueCode,
      wallet_authentication_token: walletAuthToken,
      membership_status: "temporary",
      expires_at: tempExpiresAt,
      verification_token: null,
      token_expires_at: null,
      token_purpose: null,
    })
    .eq("id", userOnly.id);

  if (verifyError) {
    console.error("Verify update failed:", verifyError);
    return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: userOnly.id,
    field: "is_verified",
    old_value: "false",
    new_value: "true",
  });

  // Generate wallet passes (async, non-blocking)
  const passData = {
    cardNumber: uniqueCode,
    userName: userOnly.nickname || userOnly.email,
    issuedAt: new Date(),
    expiresAt: new Date(tempExpiresAt),
    associationName: assocData.name,
    associationCity: "Italy",
    userEmail: userOnly.email,
  };

  Promise.all([
    generateWaspCardPass(passData),
    createGoogleWalletObjectOnApi(passData),
  ])
    .then(() => console.log(`✅ All wallet passes generated for ${uniqueCode}`))
    .catch((err) => console.error("Wallet pass generation failed:", err));

  // Notify association
  await notifyAssociation(userOnly.id, assocData as AssociationRef, userOnly.email);

  return NextResponse.redirect(
    `${base}/registrati/successo?code=${encodeURIComponent(uniqueCode)}&mobile=${isMobile}&chatToken=${encodeURIComponent(walletAuthToken)}`
  );
}
