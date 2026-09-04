import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "tg_access_token";
export const REFRESH_COOKIE_NAME = "tg_refresh_token";
export const SESSION_COOKIE_NAME = "tg_session_id";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Attach secure authentication cookies to NextResponse
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  sessionId: string
) {
  // 15 minutes for access token
  response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 mins
  });

  // 7 days for refresh token
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // 7 days for session reference
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

/**
 * Clears all authentication cookies on logout or session revocation
 */
export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

/**
 * Read auth tokens from server request cookies
 */
export function getAuthCookiesFromHeaders() {
  const cookieStore = cookies();
  return {
    accessToken: cookieStore.get(ACCESS_COOKIE_NAME)?.value,
    refreshToken: cookieStore.get(REFRESH_COOKIE_NAME)?.value,
    sessionId: cookieStore.get(SESSION_COOKIE_NAME)?.value,
  };
}
