import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { resend, RESEND_FROM } from "@/lib/resend";
import { associationNotFoundDeclineEmail } from "@/lib/email-templates";

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
  const notify = body?.notify !== false;

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from("pending_submissions")
    .select("email, nickname")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !submission) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("pending_submissions")
    .update({ status: "discarded", resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Discard failed:", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "pending_submission",
    entity_id: id,
    field: "status",
    old_value: "open",
    new_value: "discarded",
  });

  if (notify) {
    try {
      // Locale isn't tracked on pending_submissions, defaults to Italian.
      const directSignupUrl = `${siteUrl()}/it/registrati`;
      const { subject, html } = associationNotFoundDeclineEmail({
        nickname: submission.nickname ?? "there",
        directSignupUrl,
      });
      await resend.emails.send({ from: RESEND_FROM, to: submission.email, subject, html });
    } catch (sendError) {
      console.error("Failed to send decline email:", sendError);
    }
  }

  return NextResponse.json({ ok: true });
}
