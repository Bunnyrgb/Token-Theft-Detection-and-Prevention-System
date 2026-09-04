import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/database";
import { verifyPassword } from "@/lib/auth/password";
import { extractClientTelemetry } from "@/lib/security/fingerprint";
import { sessionManager } from "@/lib/auth/session-manager";
import { setAuthCookies } from "@/lib/auth/cookies";

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
      // Fake delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      // Record failed authentication attempt for anomaly calculation
      await dbRepository.createSecurityEvent({
        user_id: user.id,
        event_type: "SUSPICIOUS_ACTIVITY",
        severity: "MEDIUM",
        risk_score: 35,
        ip_address: telemetry.ipAddress,
        metadata: { reason: "Failed password challenge attempt" },
      });

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Determine if this is a previously unseen device
    const userDevices = await dbRepository.getDevicesByUser(user.id);
    const isNewDevice = !userDevices.some((d) => d.device_identifier === telemetry.deviceIdentifier);

    // Create session and issue tokens
    const sessionResult = await sessionManager.createSessionForUser(user, telemetry);

    if (isNewDevice) {
      await dbRepository.createSecurityEvent({
        user_id: user.id,
        session_id: sessionResult.session.id,
        event_type: "NEW_DEVICE",
        severity: "MEDIUM",
        risk_score: 25,
        ip_address: telemetry.ipAddress,
        device_id: sessionResult.device.id,
        metadata: {
          deviceName: telemetry.deviceName,
          browser: telemetry.browser,
          os: telemetry.operatingSystem,
        },
      });

      await dbRepository.createAlert({
        user_id: user.id,
        title: "New Device Detected",
        message: `A new device (${telemetry.deviceName} / ${telemetry.browser}) logged into your account from IP ${telemetry.ipAddress}.`,
        severity: "MEDIUM",
      });
    }

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
