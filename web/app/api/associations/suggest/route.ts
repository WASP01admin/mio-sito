import { NextRequest, NextResponse } from "next/server";
import { resend, RESEND_FROM } from "@/lib/resend";
import { ADMIN_CONTACT_EMAIL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const suggestion = typeof body?.suggestion === "string" ? body.suggestion.trim() : "";

  if (!suggestion) {
    return NextResponse.json({ ok: false, error: "suggestion_required" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: RESEND_FROM,
      to: ADMIN_CONTACT_EMAIL,
      subject: "New association suggestion from the website",
      html: `<p>${suggestion.replace(/</g, "&lt;")}</p>`,
    });
  } catch (error) {
    console.error("Failed to send association suggestion email:", error);
    return NextResponse.json({ ok: false, error: "email_send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
