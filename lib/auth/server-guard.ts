import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "./cookies";
import { sessionManager } from "./session-manager";
import { User, Session } from "../types";

export interface AuthenticatedContext {
  user: User;
  session: Session;
}

export type RequireAuthResult =
  | { success: true; auth: AuthenticatedContext; errorResponse?: never }
  | { success: false; auth?: never; errorResponse: NextResponse };

/**
 * Server-side guard to verify and extract the current authenticated session
 */
export async function requireAuth(req: NextRequest): Promise<RequireAuthResult> {
  const token = req.cookies.get(ACCESS_COOKIE_NAME)?.value || req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return {
      success: false,
      errorResponse: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  const result = await sessionManager.validateRequestSession(token);
  if (!result.valid || !result.user || !result.session) {
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: result.error || "Session invalid, expired, or revoked" },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    auth: {
      user: result.user,
      session: result.session,
    },
  };
}
