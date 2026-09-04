import { dbRepository } from "../database";
import { generateAccessToken, generateOpaqueRefreshToken, hashRefreshToken, generateSessionIdentifier, verifyAccessToken } from "./jwt";
import { extractClientTelemetry, ParsedDeviceInfo } from "../security/fingerprint";
import { calculateRisk } from "../risk-engine";
import { User, Session, Device, RiskLevel, SessionStatus } from "../types";

export interface AuthSessionResult {
  user: User;
  session: Session;
  device: Device;
  accessToken: string;
  refreshToken: string;
}

export const sessionManager = {
  /**
   * Initializes a full authenticated session upon Login or Registration
   */
  async createSessionForUser(
    user: User,
    telemetry: ParsedDeviceInfo,
    customRiskFlags?: { isNewLocation?: boolean; isSuspiciousUA?: boolean }
  ): Promise<AuthSessionResult> {
    // 1. Upsert Device
    const device = await dbRepository.upsertDevice({
      user_id: user.id,
      device_identifier: telemetry.deviceIdentifier,
      device_name: telemetry.deviceName,
      browser: telemetry.browser,
      operating_system: telemetry.operatingSystem,
      device_type: telemetry.deviceType,
      trusted: true,
    });

    // 2. Generate Refresh Token & Session Identifier
    const rawRefreshToken = generateOpaqueRefreshToken();
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);
    const sessionIdentifier = generateSessionIdentifier();

    // 3. Compute initial Risk Score
    const activeSessions = await dbRepository.getSessionsByUser(user.id);
    const hasConcurrent = activeSessions.filter((s) => s.status === "Active").length >= 2;

    const riskEval = calculateRisk({
      concurrentUsage: hasConcurrent,
      suspiciousUserAgent: customRiskFlags?.isSuspiciousUA,
      locationChanged: customRiskFlags?.isNewLocation,
    });

    // 4. Create Session Record in Database (Expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const session = await dbRepository.createSession({
      user_id: user.id,
      session_identifier: sessionIdentifier,
      refresh_token_hash: refreshTokenHash,
      device_id: device.id,
      ip_address: telemetry.ipAddress,
      user_agent: telemetry.userAgent,
      location: telemetry.location,
      expires_at: expiresAt,
      risk_score: riskEval.score,
      risk_level: riskEval.level,
      status: "Active",
    });

    // 5. Generate Short-lived Access Token (15 mins)
    const accessToken = await generateAccessToken({
      userId: user.id,
      sessionId: session.id,
      email: user.email,
    });

    // 6. Record Security Events & Audit Trail
    await dbRepository.createSecurityEvent({
      user_id: user.id,
      session_id: session.id,
      event_type: "LOGIN",
      severity: "INFO",
      risk_score: riskEval.score,
      ip_address: telemetry.ipAddress,
      device_id: device.id,
      metadata: {
        browser: telemetry.browser,
        os: telemetry.operatingSystem,
        deviceType: telemetry.deviceType,
      },
    });

    await dbRepository.createSecurityEvent({
      user_id: user.id,
      session_id: session.id,
      event_type: "TOKEN_CREATED",
      severity: "INFO",
      risk_score: 0,
      ip_address: telemetry.ipAddress,
      device_id: device.id,
      metadata: { sessionIdentifier },
    });

    if (riskEval.score >= 30) {
      await dbRepository.createAlert({
        user_id: user.id,
        title: "Elevated Risk on New Session",
        message: `Session initiated from ${telemetry.location} with risk score ${riskEval.score} (${riskEval.level}).`,
        severity: riskEval.level === "CRITICAL" ? "CRITICAL" : "MEDIUM",
      });
    }

    return {
      user,
      session,
      device,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  },

  /**
   * Refreshes access token with strict Refresh Token Rotation & Theft/Reuse Detection
   */
  async rotateRefreshToken(
    providedRefreshToken: string,
    sessionId: string,
    telemetry: ParsedDeviceInfo
  ): Promise<{ success: boolean; accessToken?: string; newRefreshToken?: string; error?: string; revoked?: boolean }> {
    if (!providedRefreshToken || !sessionId) {
      return { success: false, error: "Missing refresh credentials" };
    }

    const currentSession = await dbRepository.getSessionById(sessionId);
    if (!currentSession) {
      return { success: false, error: "Session not found" };
    }

    const providedTokenHash = hashRefreshToken(providedRefreshToken);

    // -------------------------------------------------------------------------
    // CRITICAL SECURITY CHECK: Refresh Token Reuse & Replay Theft Detection
    // -------------------------------------------------------------------------
    if (currentSession.refresh_token_hash !== providedTokenHash) {
      // THEFT / REUSE DETECTED!
      // Revoke the session immediately to prevent attacker exploitation
      await dbRepository.revokeSession(currentSession.id, currentSession.user_id);

      const criticalRiskScore = 95;
      await dbRepository.createSecurityEvent({
        user_id: currentSession.user_id,
        session_id: currentSession.id,
        event_type: "TOKEN_REUSE_DETECTED",
        severity: "CRITICAL",
        risk_score: criticalRiskScore,
        ip_address: telemetry.ipAddress,
        device_id: currentSession.device_id,
        metadata: {
          reason: "An invalidated or stolen refresh token was presented. Session was automatically revoked.",
          attemptedIp: telemetry.ipAddress,
          attemptedUA: telemetry.userAgent,
        },
      });

      await dbRepository.createAlert({
        user_id: currentSession.user_id,
        title: "CRITICAL: Token Theft & Replay Detected",
        message: `An invalidated refresh token was reused from IP ${telemetry.ipAddress}. The session was immediately terminated to safeguard your account.`,
        severity: "CRITICAL",
      });

      return {
        success: false,
        error: "Token theft detected. Session has been revoked for security.",
        revoked: true,
      };
    }

    // Check if session is already revoked or expired
    if (currentSession.status === "Revoked" || currentSession.revoked_at) {
      return { success: false, error: "Session is revoked", revoked: true };
    }

    if (new Date(currentSession.expires_at).getTime() < Date.now()) {
      await dbRepository.updateSessionActivity(currentSession.id, { status: "Expired" });
      return { success: false, error: "Session has expired" };
    }

    // Dynamic risk assessment during rotation
    const ipChanged = currentSession.ip_address !== telemetry.ipAddress;
    const uaChanged = currentSession.user_agent !== telemetry.userAgent;

    const riskEval = calculateRisk({
      ipChanged,
      suspiciousUserAgent: uaChanged,
    });

    // Generate new rotated refresh token
    const newOpaqueRefreshToken = generateOpaqueRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newOpaqueRefreshToken);

    // Issue new access token
    const user = await dbRepository.getUserById(currentSession.user_id);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const newAccessToken = await generateAccessToken({
      userId: user.id,
      sessionId: currentSession.id,
      email: user.email,
    });

    // Update session record in DB
    const now = new Date().toISOString();
    let newStatus: SessionStatus = currentSession.status;
    if (riskEval.action === "REVOKE") {
      newStatus = "Revoked";
    } else if (riskEval.score >= 30) {
      newStatus = "Suspicious";
    }

    await dbRepository.updateSessionActivity(currentSession.id, {
      last_used_at: now,
      refresh_token_hash: newRefreshTokenHash,
      risk_score: Math.max(currentSession.risk_score, riskEval.score),
      risk_level: riskEval.level,
      status: newStatus,
      ip_address: telemetry.ipAddress,
      location: telemetry.location,
    });

    // Log rotation event
    await dbRepository.createSecurityEvent({
      user_id: user.id,
      session_id: currentSession.id,
      event_type: "TOKEN_REFRESHED",
      severity: riskEval.score >= 60 ? "HIGH" : "INFO",
      risk_score: riskEval.score,
      ip_address: telemetry.ipAddress,
      device_id: currentSession.device_id,
      metadata: {
        ipChanged,
        uaChanged,
        newRiskScore: riskEval.score,
      },
    });

    if (ipChanged) {
      await dbRepository.createSecurityEvent({
        user_id: user.id,
        session_id: currentSession.id,
        event_type: "NEW_IP",
        severity: "LOW",
        risk_score: 15,
        ip_address: telemetry.ipAddress,
        device_id: currentSession.device_id,
        metadata: { oldIp: currentSession.ip_address, newIp: telemetry.ipAddress },
      });
    }

    return {
      success: true,
      accessToken: newAccessToken,
      newRefreshToken: newOpaqueRefreshToken,
    };
  },

  /**
   * Validates authenticated session from Access Token
   */
  async validateRequestSession(token: string): Promise<{
    valid: boolean;
    user?: User;
    session?: Session;
    error?: string;
  }> {
    if (!token) return { valid: false, error: "No token provided" };

    const payload = await verifyAccessToken(token);
    if (!payload || !payload.userId || !payload.sessionId) {
      return { valid: false, error: "Invalid token" };
    }

    const session = await dbRepository.getSessionById(payload.sessionId);
    if (!session) {
      return { valid: false, error: "Session not found" };
    }

    if (session.status === "Revoked" || session.revoked_at) {
      return { valid: false, error: "Session revoked" };
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      return { valid: false, error: "Session expired" };
    }

    const user = await dbRepository.getUserById(payload.userId);
    if (!user) {
      return { valid: false, error: "User not found" };
    }

    return { valid: true, user, session };
  },
};
