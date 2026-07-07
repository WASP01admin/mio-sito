import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function htmlResponse(title: string, message: string, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
    .card { max-width: 420px; }
    h1 { font-size: 22px; }
    p { color: #444; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// Intentionally idempotent (not single-use): mail security scanners can
// pre-fetch links automatically, and each click here just overwrites the
// recorded answer with the latest one -- admin still makes the final call
// in the admin panel, this only records a signal.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const answer = request.nextUrl.searchParams.get("answer");

  if (!token || (answer !== "yes" && answer !== "no")) {
    return htmlResponse(
      "Invalid link",
      "This confirmation link is missing required information.",
      400
    );
  }

  const { data: profile, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id, association_reply")
    .eq("association_confirmation_token", token)
    .maybeSingle();

  if (error) {
    console.error("Association-confirm lookup failed:", error);
    return htmlResponse(
      "Something went wrong",
      "Please try again in a moment, or reply to the original email instead.",
      500
    );
  }

  if (!profile) {
    return htmlResponse(
      "Link not found",
      "This confirmation link is invalid or has expired. Please reply to the original email instead.",
      404
    );
  }

  const previousReply = profile.association_reply;

  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update({ association_reply: answer, association_confirmed_at: new Date().toISOString() })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Association-confirm update failed:", updateError);
    return htmlResponse(
      "Something went wrong",
      "Please try again in a moment, or reply to the original email instead.",
      500
    );
  }

  await supabaseAdmin.from("audit_log").insert({
    entity_type: "user_profile",
    entity_id: profile.id,
    field: "association_reply",
    old_value: previousReply,
    new_value: answer,
  });

  return htmlResponse(
    "Thank you!",
    answer === "yes"
      ? "You confirmed this email belongs to someone in your records. Our team will review and finalize their membership shortly."
      : "You indicated this email does not belong to anyone in your records. Our team will follow up as needed."
  );
}
