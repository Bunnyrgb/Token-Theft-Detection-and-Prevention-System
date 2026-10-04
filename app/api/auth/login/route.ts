import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/database";
import { verifyPassword } from "@/lib/auth/password";
import { extractClientTelemetry } from "@/lib/security/fingerprint";
import { sessionManager } from "@/lib/auth/session-manager";
import { setAuthCookies } from "@/lib/auth/cookies";
import { eventEngine } from "@/lib/security/event-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const telemetry = extractClientTelemetry(req.headers);
    const user = await dbRepository.getUserByEmail(email);

    if (!user) {
      // Record failed login for IP tracking
      await dbRepository.recordFailedLogin(email, telemetry.ipAddress, telemetry.userAgent);
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      // Record failed authentication attempt for anomaly calculation
      await dbRepository.recordFailedLogin(email, telemetry.ipAddress, telemetry.userAgent);
      const recentFailedAttempts = await dbRepository.getRecentFailedLoginsCount(email, 15);

      const penalty = Math.min(40, recentFailedAttempts * 10);
      await eventEngine.emit({
        userId: user.id,
        eventType: "LOGIN_FAILED",
        severity: recentFailedAttempts >= 3 ? "HIGH" : "MEDIUM",
        riskScore: penalty,
        ipAddress: telemetry.ipAddress,
        userAgent: telemetry.userAgent,
        location: telemetry.location,
        description: `Failed login attempt (#${recentFailedAttempts} in 15m) from ${telemetry.location} (${telemetry.ipAddress}).`,
        reason: "Invalid password provided.",
        actionTaken: recentFailedAttempts >= 5 ? "Temporary challenge lock initiated." : "Authentication rejected.",
        metadata: {
          failedAttemptCount: recentFailedAttempts,
        },
      });

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check failed attempts prior to this successful login
    const failedPriorToLogin = await dbRepository.getRecentFailedLoginsCount(email, 15);

    // Create session and issue tokens (handles device detection & risk engine)
    const sessionResult = await sessionManager.createSessionForUser(user, telemetry);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      session: {
        id: sessionResult.session.id,
        session_identifier: sessionResult.session.session_identifier,
        risk_score: sessionResult.session.risk_score,
        risk_level: sessionResult.session.risk_level,
      },
    });

    return setAuthCookies(
      response,
      sessionResult.accessToken,
      sessionResult.refreshToken,
      sessionResult.session.id
    );
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
