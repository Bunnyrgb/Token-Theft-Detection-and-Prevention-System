import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/database";
import { clearAuthCookies, SESSION_COOKIE_NAME, ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractClientTelemetry } from "@/lib/security/fingerprint";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const telemetry = extractClientTelemetry(req.headers);

    if (sessionId) {
      const session = await dbRepository.getSessionById(sessionId);
      if (session) {
        await dbRepository.revokeSession(sessionId, session.user_id);

        await dbRepository.createSecurityEvent({
          user_id: session.user_id,
          session_id: sessionId,
          event_type: "LOGOUT",
          severity: "INFO",
          risk_score: 0,
          ip_address: telemetry.ipAddress,
          device_id: session.device_id,
          metadata: { cleanLogout: true },
        });
      }
    } else if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload?.sessionId && payload?.userId) {
        await dbRepository.revokeSession(payload.sessionId, payload.userId);
      }
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    return clearAuthCookies(response);
  } catch (error: any) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true });
    return clearAuthCookies(response);
  }
}
