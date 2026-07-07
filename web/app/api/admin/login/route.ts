import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, createSessionToken, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
