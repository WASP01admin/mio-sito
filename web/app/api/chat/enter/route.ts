import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createChatSessionToken } from "";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveLocale } from "@/lib/locale";
import { CHAT_SESSION_COOKIE, CHAT_SESSION_TTL_MS, chatAuthSecret } from "@/lib/chat";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// This is the ONLY door into chat: reachable exclusively via the token
// printed on a member's own card (wallet_authentication_token). There is no
// public signup or login form for chat at all.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const locale = resolveLocale(request.nextUrl.searchParams.get("locale"));
  const base = `${siteUrl()}/${locale}`;

  if (!token) {
    return NextResponse.redirect(`${base}/registrati/errore?reason=missing_token`);
  }

  const { data: profile, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id, nickname, membership_status")
    .eq("wallet_authentication_token", token)
    .maybeSingle();

  if (error) {
    console.error("Chat enter lookup failed:", error);
    return NextResponse.redirect(`${base}/registrati/errore?reason=server_error`);
  }
  if (!profile || profile.membership_status === "rejected") {
    return NextResponse.redirect(`${base}/registrati/errore?reason=invalid_token`);
  }

  const { data: ban } = await supabaseAdmin
    .from("chat_bans")
    .select("id")
    .eq("user_profile_id", profile.id)
    .maybeSingle();

  if (ban) {
    return NextResponse.redirect(`${base}/registrati/errore?reason=invalid_token`);
  }

  const sessionToken = createChatSessionToken(
    { userProfileId: profile.id, nickname: profile.nickname ?? "Member" },
    chatAuthSecret(),
    CHAT_SESSION_TTL_MS
  );

  const cookieStore = await cookies();
  cookieStore.set(CHAT_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHAT_SESSION_TTL_MS / 1000,
  });

  return NextResponse.redirect(`${siteUrl()}/chat`);
}
