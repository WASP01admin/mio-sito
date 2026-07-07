import { NextRequest, NextResponse } from "next/server";
import { ASSOCIATION_SESSION_COOKIE } from "@/lib/association-auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: ASSOCIATION_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return response;
}
