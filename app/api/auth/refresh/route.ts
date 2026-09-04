import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "@/lib/auth/session-manager";
import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME, setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { extractClientTelemetry } from "@/lib/security/fingerprint";

export async function POST(req: NextRequest) {
  try {
    let refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    let sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Allow testing via JSON payload if specified
    if (!refreshToken || !sessionId) {
      try {
        const body = await req.json();
        if (body.refreshToken) refreshToken = body.refreshToken;
        if (body.sessionId) sessionId = body.sessionId;
      } catch {}
    }

    if (!refreshToken || !sessionId) {
      return NextResponse.json({ error: "No refresh token or session identifier provided" }, { status: 401 });
    }

    const telemetry = extractClientTelemetry(req.headers);
    const result = await sessionManager.rotateRefreshToken(refreshToken, sessionId, telemetry);

    if (!result.success || !result.accessToken || !result.newRefreshToken) {
      const response = NextResponse.json(
        { error: result.error || "Token refresh failed", revoked: result.revoked || false },
        { status: 401 }
      );
      if (result.revoked) {
        clearAuthCookies(response);
      }
      return response;
    }

    const response = NextResponse.json({
      success: true,
      message: "Tokens rotated successfully",
    });

    return setAuthCookies(response, result.accessToken, result.newRefreshToken, sessionId);
  } catch (error: any) {
    console.error("Refresh route error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
