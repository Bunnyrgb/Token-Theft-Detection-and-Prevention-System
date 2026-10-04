import { dbRepository } from "../database";
import { generateAccessToken, generateOpaqueRefreshToken, hashRefreshToken, generateSessionIdentifier, verifyAccessToken } from "./jwt";
import { ParsedDeviceInfo } from "../security/fingerprint";
import { calculateRisk } from "../risk-engine";
import { eventEngine } from "../security/event-engine";
import { analyzeTravelVelocity } from "../security/geo-anomaly";
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
    // 1. Check if device is previously known
    const existingDevices = await dbRepository.getDevicesByUser(user.id);
    const isKnownDevice = existingDevices.some((d) => d.device_identifier === telemetry.deviceIdentifier);

    // 2. Upsert Device
    const device = await dbRepository.upsertDevice({
      user_id: user.id,
      device_identifier: telemetry.deviceIdentifier,
      device_name: telemetry.deviceName,
      browser: telemetry.browser,
      operating_system: telemetry.operatingSystem,
      device_type: telemetry.deviceType,
      trusted: isKnownDevice,
    });

    // 3. Generate Refresh Token & Session Identifier
    const rawRefreshToken = generateOpaqueRefreshToken();
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);
    const sessionIdentifier = generateSessionIdentifier();

    // 4. Compute initial Risk Score
    const activeSessions = await dbRepository.getSessionsByUser(user.id);
    const hasConcurrent = activeSessions.filter((s) => s.status === "Active").length >= 2;

    const riskEval = calculateRisk({
      deviceChanged: !isKnownDevice,
      concurrentUsage: hasConcurrent,
      suspiciousUserAgent: customRiskFlags?.isSuspiciousUA,
      locationChanged: customRiskFlags?.isNewLocation,
    });

    // 5. Create Session Record in Database (Expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    const session = await dbRepository.createSession({
      user_id: user.id,
      session_identifier: sessionIdentifier,
      refresh_token_hash: refreshTokenHash,
      previous_refresh_token_hashes: [],
      rotation_count: 0,
      last_rotated_at: now,
      device_id: device.id,
      ip_address: telemetry.ipAddress,
      user_agent: telemetry.userAgent,
      location: telemetry.location,
      expires_at: expiresAt,
      risk_score: riskEval.score,
      risk_level: riskEval.level,
      status: "Active",
    });

    // 6. Generate Short-lived Access Token (15 mins)
    const accessToken = await generateAccessToken({
      userId: user.id,
      sessionId: session.id,
      email: user.email,
    });

    // 7. Record Security Events via central Event Engine
    await eventEngine.emit({
      userId: user.id,
      sessionId: session.id,
      eventType: "LOGIN_SUCCESS",
      severity: "INFO",
      riskScore: riskEval.score,
      ipAddress: telemetry.ipAddress,
      deviceId: device.id,
      userAgent: telemetry.userAgent,
      location: telemetry.location,
      description: `Authenticated successfully on ${device.device_name} from ${telemetry.location} (${telemetry.ipAddress}).`,
      actionTaken: "Session created and access tokens issued.",
      metadata: {
        browser: telemetry.browser,
        os: telemetry.operatingSystem,
        deviceType: telemetry.deviceType,
      },
    });

    await eventEngine.emit({
      userId: user.id,
      sessionId: session.id,
      eventType: "TOKEN_ISSUED",
      severity: "INFO",
      riskScore: 0,
      ipAddress: telemetry.ipAddress,
      deviceId: device.id,
      userAgent: telemetry.userAgent,
      location: telemetry.location,
      description: "Cryptographic token family issued (15m access / 7d refresh with rotation).",
      actionTaken: "Tokens delivered to client.",
      metadata: { sessionIdentifier },
    });

    if (!isKnownDevice) {
      await eventEngine.emit({
        userId: user.id,
        sessionId: session.id,
        eventType: "DEVICE_CHANGED",
        severity: "MEDIUM",
        riskScore: 20,
        ipAddress: telemetry.ipAddress,
        deviceId: device.id,
        userAgent: telemetry.userAgent,
        location: telemetry.location,
        description: `New device detected: ${device.device_name} (${telemetry.browser} on ${telemetry.operatingSystem}).`,
        reason: "Device fingerprint not found in enrolled trusted devices.",
        actionTaken: "Device added to registry with unverified status.",
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
   * Refreshes access token with strict Refresh Token Rotation & Replay/Theft Detection
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
    // CRITICAL SECURITY CHECK: Refresh Token Replay / Theft Detection
    // Check if the presented token matches ANY previously rotated token hash
    // -------------------------------------------------------------------------
    const previousHashes = currentSession.previous_refresh_token_hashes || [];
    const isReplayAttack = previousHashes.includes(providedTokenHash);

    if (isReplayAttack || (currentSession.refresh_token_hash !== providedTokenHash)) {
      // THEFT / REPLAY DETECTED!
      // Invalidate the session tree immediately to neutralize attacker access
      await dbRepository.revokeSession(currentSession.id, currentSession.user_id);

      const criticalRiskScore = 95;
      await eventEngine.emit({
        userId: currentSession.user_id,
        sessionId: currentSession.id,
        eventType: "TOKEN_REPLAY_DETECTED",
        severity: "CRITICAL",
        riskScore: criticalRiskScore,
        ipAddress: telemetry.ipAddress,
        deviceId: currentSession.device_id,
        userAgent: telemetry.userAgent,
        location: telemetry.location,
        description: `CRITICAL: Previously rotated refresh token presented again from ${telemetry.location} (${telemetry.ipAddress}). Session terminated to prevent token hijacking.`,
        reason: "A previously rotated refresh-token identifier was presented again.",
        actionTaken: "Session automatically revoked; tokens invalidated immediately.",
        metadata: {
          sessionIdentifier: currentSession.session_identifier,
          attemptedIp: telemetry.ipAddress,
          attemptedUA: telemetry.userAgent,
          rotationCount: currentSession.rotation_count || 0,
        },
      });

      return {
        success: false,
        error: "Token replay attack detected. Session has been revoked for security.",
        revoked: true,
      };
    }

    // Check if session is already revoked or expired
    if (currentSession.status === "Revoked" || currentSession.revoked_at) {
      return { success: false, error: "Session is revoked", revoked: true };
    }

    if (new Date(currentSession.expires_at).getTime() < Date.now()) {
      await dbRepository.updateSessionActivity(currentSession.id, { status: "Expired" });
      await eventEngine.emit({
        userId: currentSession.user_id,
        sessionId: currentSession.id,
        eventType: "SESSION_EXPIRED",
        severity: "INFO",
        riskScore: 0,
        ipAddress: telemetry.ipAddress,
        deviceId: currentSession.device_id,
        description: "Session authorization expired after token validity duration.",
        actionTaken: "Access blocked; re-authentication required.",
      });
      return { success: false, error: "Session has expired" };
    }

    // Dynamic travel velocity & IP anomaly analysis
    const travelAnalysis = analyzeTravelVelocity(
      currentSession.location || "Hyderabad, IN",
      currentSession.ip_address,
      currentSession.last_used_at,
      telemetry.location,
      telemetry.ipAddress,
      new Date()
    );

    const uaChanged = currentSession.user_agent !== telemetry.userAgent;

    const riskEval = calculateRisk({
      ipChanged: travelAnalysis.isIpChanged,
      impossibleTravel: travelAnalysis.isImpossibleTravel,
      suspiciousUserAgent: uaChanged,
    });

    // Generate new rotated refresh token & store previous hash in token family history
    const newOpaqueRefreshToken = generateOpaqueRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newOpaqueRefreshToken);
    const updatedPreviousHashes = [...previousHashes, currentSession.refresh_token_hash];
    const newRotationCount = (currentSession.rotation_count || 0) + 1;

    // Issue new access token (15m)
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
      last_rotated_at: now,
      rotation_count: newRotationCount,
      refresh_token_hash: newRefreshTokenHash,
      previous_refresh_token_hashes: updatedPreviousHashes,
      risk_score: Math.max(currentSession.risk_score, riskEval.score),
      risk_level: riskEval.level,
      status: newStatus,
      ip_address: telemetry.ipAddress,
      location: telemetry.location,
    });

    // Log rotation event
    await eventEngine.emit({
      userId: user.id,
      sessionId: currentSession.id,
      eventType: "TOKEN_ROTATED",
      severity: riskEval.score >= 60 ? "HIGH" : "INFO",
      riskScore: riskEval.score,
      ipAddress: telemetry.ipAddress,
      deviceId: currentSession.device_id,
      userAgent: telemetry.userAgent,
      location: telemetry.location,
      description: `Refresh token rotated successfully (Cycle #${newRotationCount}). Old token hash retired.`,
      actionTaken: "Issued new access token & rotated refresh token.",
      metadata: {
        rotationCount: newRotationCount,
        ipChanged: travelAnalysis.isIpChanged,
      },
    });

    if (travelAnalysis.isImpossibleTravel) {
      await eventEngine.emit({
        userId: user.id,
        sessionId: currentSession.id,
        eventType: "IMPOSSIBLE_TRAVEL",
        severity: "HIGH",
        riskScore: travelAnalysis.riskScore,
        ipAddress: telemetry.ipAddress,
        deviceId: currentSession.device_id,
        userAgent: telemetry.userAgent,
        location: telemetry.location,
        description: travelAnalysis.explanation,
        reason: "Geographic displacement speed exceeds plausible physical aircraft transit.",
        actionTaken: "Heightened risk score recorded; step-up verification recommended.",
        metadata: {
          distanceKm: travelAnalysis.estimatedDistanceKm,
          speedKmH: travelAnalysis.requiredSpeedKmH,
          disclaimer: travelAnalysis.disclaimer,
        },
      });
    } else if (travelAnalysis.isIpChanged) {
      await eventEngine.emit({
        userId: user.id,
        sessionId: currentSession.id,
        eventType: "IP_CHANGED",
        severity: travelAnalysis.classification === "Suspicious IP Change" ? "MEDIUM" : "LOW",
        riskScore: travelAnalysis.riskScore,
        ipAddress: telemetry.ipAddress,
        deviceId: currentSession.device_id,
        userAgent: telemetry.userAgent,
        location: telemetry.location,
        description: travelAnalysis.explanation,
        actionTaken: "Telemetry updated in session registry.",
        metadata: {
          previousIp: currentSession.ip_address,
          currentIp: telemetry.ipAddress,
        },
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
