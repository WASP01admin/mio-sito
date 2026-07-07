import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "./lib/admin-auth";

const intlMiddleware = createMiddleware(routing);

// Named `proxy.ts` per the Next.js 16 convention (formerly `middleware.ts`).
// The admin and chat sections are intentionally outside next-intl's locale
// routing (own root layouts), so they're handled here before falling
// through to the locale middleware for everything else.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifySessionToken(session)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // No separate login page here -- the /chat page itself checks the
  // session cookie server-side and shows "Access denied" if invalid.
  // (/api/chat/* is already excluded by the matcher below.)
  if (pathname.startsWith("/chat")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
