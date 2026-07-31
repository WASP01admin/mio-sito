import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirect locale-prefixed admin routes to base admin routes
  // e.g. /en/admin/login → /admin/login
  const adminMatch = pathname.match(/^\/(en|it)\/admin(\/.*)?$/);
  if (adminMatch) {
    const adminPath = adminMatch[2] || '';
    return NextResponse.redirect(new URL(`/admin${adminPath}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(en|it)/admin/:path*'],
};
