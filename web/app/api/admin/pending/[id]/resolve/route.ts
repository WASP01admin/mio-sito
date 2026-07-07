import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateToken } from "@/lib/membership-code";
import { resend, RESEND_FROM } from "@/lib/resend";
import { verifyEmail } from "@/lib/email-templates";

const TOKEN_EXPIRY_DAYS = 7;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const associationId = typeof body?.associationId === "string" ? body.associationId : "";

  if (!associationId) {
    return NextResponse.json({ ok: false, error: "association_required" }, { status: 400 });
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from("pending_submissions")
    .select("id, email, nickname, photo_path, status")
    .eq("id", id)
    .maybeSingle();

  if (submissionError || !submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (submission.status !== "open") {
    return NextResponse.json({ ok: false, error: "already_resolved" }, { status: 409 });
  }

  const { data: association, error: associationError } = await supabaseAdmin
    .from("associations")
    .select("id")
    .eq("id", associationId)
    .maybeSingle();

  if (associationError || !association) {
    return NextResponse.json({ ok: false, error: "association_not_found" }, { status: 400 });
  }

  const { data: existingProfile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("email", submission.email)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json({ ok: false, error: "email_already_registered" }, { status: 409 });
  }

  const token = generateToken();
  const tokenExpiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: insertError } = await supabaseAdmin.from("user_profiles").insert({
    association_id: association.id,
    nickname: submission.nickname,
    email: submission.email,
    photo_path: submission.photo_path,
    verification_token: token,
    token_expires_at: tokenExpiresAt,
    token_purpose: "signup",
  });

  if (insertError) {
    console.error("Resolve: failed to create user_profiles row:", insertError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // Locale isn't tracked on pending_submissions, so this defaults to the
  // site's default locale rather than whatever the original visitor used.
  const verificationUrl = `${siteUrl()}/api/verify?token=${token}&locale=it`;
  const { subject, html } = verifyEmail({
    nickname: submission.nickname ?? "there",
    verificationUrl,
  });

  try {
    await resend.emails.send({ from: RESEND_FROM, to: submission.email, subject, html });
  } catch (error) {
    console.error("Resolve: failed to send verification email:", error);
  }

  const { error: resolveError } = await supabaseAdmin
    .from("pending_submissions")
    .update({
      status: "resolved",
      resolved_association_id: association.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (resolveError) {
    console.error("Resolve: failed to update pending_submissions:", resolveError);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "pending_submission",
    entity_id: id,
    field: "status",
    old_value: "open",
    new_value: "resolved",
  });

  return NextResponse.json({ ok: true });
}
