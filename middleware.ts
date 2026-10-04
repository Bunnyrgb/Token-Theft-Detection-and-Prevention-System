import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "./lib/auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasAccessToken = request.cookies.has(ACCESS_COOKIE_NAME);
  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE_NAME);
  const hasSessionId = request.cookies.has(SESSION_COOKIE_NAME);

  const isAuthenticated = hasAccessToken || (hasRefreshToken && hasSessionId);

  // Protected Dashboard Routes: redirect unauthenticated requests to /login
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
