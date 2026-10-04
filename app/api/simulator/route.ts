import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { generateOpaqueRefreshToken, hashRefreshToken, generateSessionIdentifier } from "@/lib/auth/jwt";
import { calculateRisk } from "@/lib/risk-engine";
import { eventEngine } from "@/lib/security/event-engine";
import { analyzeTravelVelocity } from "@/lib/security/geo-anomaly";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const body = await req.json();
  const { scenario } = body;

  switch (scenario) {
    // ------------------------------------------------------------------
    // 1. NORMAL LOGIN (Baseline)
    // ------------------------------------------------------------------
    case "SIMULATE_NORMAL_LOGIN": {
      const risk = calculateRisk({});
      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: auth.session.id,
        eventType: "LOGIN_SUCCESS",
        severity: "INFO",
        riskScore: risk.score,
        ipAddress: auth.session.ip_address,
        deviceId: auth.session.device_id,
        userAgent: auth.session.user_agent,
        location: auth.session.location,
        description: `Simulated normal login from verified device (${auth.session.location}).`,
        reason: "Credentials verified against cryptographic baseline; familiar device & network.",
        actionTaken: "ALLOW: Session permitted without friction.",
        isSimulation: true,
        metadata: { scenario: "SIMULATE_NORMAL_LOGIN" },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: "Simulated standard authenticated login. Telemetry matches baseline (+0 risk).",
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Baseline Authenticated Login [DEMO/SIMULATION]",
          "2. Telemetry Ingested: Familiar IP & Device Fingerprint",
          `3. Risk Engine: Evaluated 0 anomaly points -> Score: ${risk.score} (${risk.level})`,
          "4. Security Policy: ALLOW (Session permitted without friction)",
          `5. Audit Log: Event ${event.id} stored [is_simulation: true]`,
          "6. Feed Synchronization: Live Dashboard updated with zero-risk event",
        ],
      });
    }

    // ------------------------------------------------------------------
    // 2. NEW DEVICE
    // ------------------------------------------------------------------
    case "SIMULATE_NEW_DEVICE": {
      const randomBrowsers = [
        "Firefox 128 on Android 14",
        "Opera GX on macOS Sonoma",
        "Brave 1.68 on Ubuntu Linux",
        "Safari 17.5 on iOS 17",
      ];
      const randomBrowser = randomBrowsers[Math.floor(Math.random() * randomBrowsers.length)];
      const randomIdentifier = "dev_sim_" + Math.random().toString(36).substring(2, 10);
      const isMac = randomBrowser.includes("macOS");
      const isLinux = randomBrowser.includes("Linux");

      const device = await dbRepository.upsertDevice({
        user_id: auth.user.id,
        device_identifier: randomIdentifier,
        device_name: `Simulated ${randomBrowser}`,
        browser: randomBrowser.split(" on ")[0],
        operating_system: isMac ? "macOS" : isLinux ? "Linux" : "Android",
        device_type: randomBrowser.includes("Android") || randomBrowser.includes("iOS") ? "Mobile" : "Desktop",
        trusted: false,
      });

      // Risk engine evaluates new device (+20) + new IP subnet (+10) -> Score: 30 (MEDIUM)
      const risk = calculateRisk({ deviceChanged: true, ipChanged: true });
      const sessId = generateSessionIdentifier();
      const refToken = generateOpaqueRefreshToken();

      const session = await dbRepository.createSession({
        user_id: auth.user.id,
        session_identifier: sessId,
        refresh_token_hash: hashRefreshToken(refToken),
        previous_refresh_token_hashes: [],
        rotation_count: 0,
        device_id: device.id,
        ip_address: "198.51.100.42",
        user_agent: `Mozilla/5.0 (${randomBrowser})`,
        location: "Frankfurt, Germany",
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        risk_score: risk.score,
        risk_level: risk.level,
        status: "Active",
      });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: session.id,
        eventType: "DEVICE_CHANGED",
        severity: "MEDIUM",
        riskScore: risk.score,
        ipAddress: "198.51.100.42",
        deviceId: device.id,
        userAgent: `Mozilla/5.0 (${randomBrowser})`,
        location: "Frankfurt, Germany",
        description: `Simulated login from unverified device: ${device.device_name}.`,
        reason: "Device fingerprint not found in enrolled trusted devices registry (+20 pts).",
        actionTaken: "MONITOR: Device registered as unverified; security alert created.",
        isSimulation: true,
        metadata: { scenario: "SIMULATE_NEW_DEVICE", deviceName: device.device_name },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated new device login: ${device.device_name} (Risk: ${risk.level}, ${risk.score} pts)`,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        action: risk.action,
        createdSessionId: session.id,
        stages: [
          "1. Simulation Triggered: Unrecognized Device Fingerprint [DEMO/SIMULATION]",
          `2. Telemetry Ingested: Browser: ${device.browser}, OS: ${device.operating_system}, IP: 198.51.100.42`,
          `3. Detection Engine: Unenrolled device fingerprint flagged as untrusted`,
          `4. Risk Engine: Device penalty (+20) + Network change (+10) -> Score: ${risk.score} (${risk.level})`,
          "5. Security Policy: MONITOR (Added to unverified device registry & alert emitted)",
          `6. Audit Log: Event ${event.id} stored [is_simulation: true]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 3. EXPIRED TOKEN (NEW)
    // ------------------------------------------------------------------
    case "SIMULATE_EXPIRED_TOKEN": {
      // Generate a simulated expired token representation (Never a real user's token)
      const simExpiredTokenId = "sim_exp_jwt_" + Math.random().toString(36).substring(2, 10);
      const maskedToken = simExpiredTokenId.substring(0, 14) + "••••••••••";

      // Evaluate through Risk Engine: tokenExpired (+35) -> Score: 35 (MEDIUM)
      const risk = calculateRisk({ tokenExpired: true });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: auth.session.id,
        eventType: "TOKEN_EXPIRED",
        severity: "MEDIUM",
        riskScore: risk.score,
        ipAddress: auth.session.ip_address,
        deviceId: auth.session.device_id,
        userAgent: auth.session.user_agent,
        location: auth.session.location,
        description: `Simulated presentation of cryptographically expired token [${maskedToken}]. Token expired 3 hours ago.`,
        reason: "Cryptographic expiration timestamp (exp) has elapsed; refresh window required.",
        actionTaken: "MONITOR: Expired token rejected; user prompted to re-authenticate.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_EXPIRED_TOKEN",
          simulatedTokenId: maskedToken,
          expiredHoursAgo: 3,
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated Expired Token presentation [${maskedToken}]. Token rejected; re-authentication required (Risk: ${risk.score} ${risk.level}).`,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        action: risk.action,
        stages: [
          `1. Simulation Triggered: Expired Token Presentation [${maskedToken}] [DEMO/SIMULATION]`,
          "2. Token Validation Engine: Decoded JWT claims -> exp claim timestamp is in the past",
          `3. Detection Engine: Flagged TOKEN_EXPIRED (Cryptographic validity window closed)`,
          `4. Risk Engine: Expired token penalty (+35 pts) -> Score: ${risk.score} (${risk.level})`,
          "5. Security Policy: MONITOR / CHALLENGE (Reject token; require silent refresh or sign-in)",
          `6. Audit Log: Event ${event.id} stored [is_simulation: true]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 4. MULTIPLE FAILED LOGINS (Brute-Force)
    // ------------------------------------------------------------------
    case "SIMULATE_FAILED_LOGINS": {
      // Risk engine evaluates 5 consecutive failed attempts (5 x 10) -> Score: 50 (HIGH)
      const risk = calculateRisk({ failedAttempts: 5 });
      const attackerIp = "198.51.100.99";

      const event = await eventEngine.emit({
        userId: auth.user.id,
        eventType: "LOGIN_FAILED",
        severity: "HIGH",
        riskScore: risk.score,
        ipAddress: attackerIp,
        userAgent: "Python-Requests/2.31.0 (Automated Dictionary Attack)",
        location: "Kyiv, Ukraine",
        description: `Simulated brute-force attack: 5 consecutive failed password attempts detected from ${attackerIp}.`,
        reason: "Repeated credential failures within short interval indicative of dictionary or stuffing attack (+50 pts).",
        actionTaken: "CHALLENGE: Origin IP temporarily rate-limited; step-up verification required.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_FAILED_LOGINS",
          attempts: 5,
          attackerIp,
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated brute-force attack: 5 rapid failed logins from ${attackerIp} (Risk: ${risk.score} ${risk.level})`,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Automated Credential Stuffing Burst [DEMO/SIMULATION]",
          `2. Telemetry Ingested: 5 consecutive failed login attempts from ${attackerIp}`,
          "3. Detection Engine: Detected anomalous failure velocity exceeding brute-force threshold",
          `4. Risk Engine: Repeated failure penalty (+30) + Anomaly cadence (+20) -> Score: ${risk.score} (${risk.level})`,
          "5. Security Policy: CHALLENGE (Origin IP throttled; security alert dispatched)",
          `6. Audit Log: Event ${event.id} stored [is_simulation: true]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 5. SUSPICIOUS MULTIPLE SESSIONS (NEW)
    // ------------------------------------------------------------------
    case "SIMULATE_MULTIPLE_SESSIONS": {
      // Create a concurrent simulated session in an anomalous region
      const foreignDevId = "dev_sim_foreign_" + Math.random().toString(36).substring(2, 8);
      const foreignDevice = await dbRepository.upsertDevice({
        user_id: auth.user.id,
        device_identifier: foreignDevId,
        device_name: "Simulated Concurrent Laptop",
        browser: "Chrome 127",
        operating_system: "Windows 11",
        device_type: "Desktop",
        trusted: false,
      });

      const foreignSessId = generateSessionIdentifier();
      const foreignRef = generateOpaqueRefreshToken();

      const foreignSession = await dbRepository.createSession({
        user_id: auth.user.id,
        session_identifier: foreignSessId,
        refresh_token_hash: hashRefreshToken(foreignRef),
        previous_refresh_token_hashes: [],
        rotation_count: 0,
        device_id: foreignDevice.id,
        ip_address: "185.220.101.5",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        location: "Amsterdam, Netherlands",
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        risk_score: 55,
        risk_level: "HIGH",
        status: "Active",
      });

      // Risk engine evaluates concurrent sessions (+15) + location shift (+20) + abnormal cadence (+20) -> Score: 55 (HIGH)
      const risk = calculateRisk({
        concurrentUsage: true,
        locationChanged: true,
        unusualActivity: true,
      });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: foreignSession.id,
        eventType: "MULTIPLE_SESSIONS",
        severity: "HIGH",
        riskScore: risk.score,
        ipAddress: "185.220.101.5",
        deviceId: foreignDevice.id,
        location: "Amsterdam, Netherlands",
        description: `Simulated anomalous concurrent session detected from Amsterdam, Netherlands while primary session is active in ${auth.session.location}.`,
        reason: "Simultaneous active sessions operating across non-correlated geographical endpoints (+55 pts).",
        actionTaken: "CHALLENGE: Suspicious concurrent session flagged; high-priority alert generated.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_MULTIPLE_SESSIONS",
          primaryLocation: auth.session.location,
          concurrentLocation: "Amsterdam, Netherlands",
          concurrentSessionIdentifier: foreignSession.session_identifier,
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated suspicious concurrent session detected in Amsterdam, Netherlands (Risk: ${risk.score} ${risk.level})`,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        action: risk.action,
        createdSessionId: foreignSession.id,
        stages: [
          "1. Simulation Triggered: Concurrent Multi-Endpoint Session [DEMO/SIMULATION]",
          `2. Telemetry Ingested: Primary: ${auth.session.location} vs Concurrent: Amsterdam, Netherlands (185.220.101.5)`,
          "3. Detection Engine: Detected concurrent active tokens across conflicting geographic nodes",
          `4. Risk Engine: Concurrent usage (+15) + Location shift (+20) + Cadence anomaly (+20) -> Score: ${risk.score} (${risk.level})`,
          "5. Security Policy: CHALLENGE (Flag foreign session; operator alerted to verify legitimacy)",
          `6. Audit Log: Event ${event.id} stored [is_simulation: true]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 6. IMPOSSIBLE TRAVEL
    // ------------------------------------------------------------------
    case "SIMULATE_IMPOSSIBLE_TRAVEL": {
      const distantLocations = [
        { loc: "London, United Kingdom", ip: "51.140.22.1" },
        { loc: "Tokyo, Japan", ip: "203.0.113.195" },
        { loc: "New York, United States", ip: "192.0.2.14" },
      ];
      const target = distantLocations[Math.floor(Math.random() * distantLocations.length)];

      const travel = analyzeTravelVelocity(
        auth.session.location || "Hyderabad, IN",
        auth.session.ip_address,
        new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        target.loc,
        target.ip,
        new Date()
      );

      // Risk engine evaluates impossible travel (+30) + location shift (+20) + IP change (+10) -> Score: 60 (HIGH)
      const risk = calculateRisk({
        impossibleTravel: true,
        locationChanged: true,
        ipChanged: true,
      });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: auth.session.id,
        eventType: "IMPOSSIBLE_TRAVEL",
        severity: "HIGH",
        riskScore: risk.score,
        ipAddress: target.ip,
        deviceId: auth.session.device_id,
        location: target.loc,
        description: `Impossible Travel anomaly: Relocation from ${auth.session.location} to ${target.loc} in 20 minutes requires ${travel.requiredSpeedKmH} km/h (commercial flights max ~800 km/h).`,
        reason: "Geographic displacement speed exceeds plausible physical aircraft transit (+60 pts).",
        actionTaken: "CHALLENGE: Step-up re-authentication required; high-priority alert issued.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_IMPOSSIBLE_TRAVEL",
          distanceKm: travel.estimatedDistanceKm,
          speedKmH: travel.requiredSpeedKmH,
          disclaimer: travel.disclaimer,
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated Impossible Travel: ${auth.session.location} -> ${target.loc} in 20 mins (${travel.requiredSpeedKmH} km/h). Risk: ${risk.score} (${risk.level})`,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Impossible Travel Velocity Anomaly [DEMO/SIMULATION]",
          `2. Telemetry Ingested: Origin: ${auth.session.location} -> Current: ${target.loc} (20 mins elapsed)`,
          `3. Velocity Engine: Displacement of ~${travel.estimatedDistanceKm} km requires ${travel.requiredSpeedKmH} km/h (> 800 km/h threshold)`,
          `4. Risk Engine: Impossible Travel (+30) + Geo Shift (+20) + New IP (+10) -> Score: ${risk.score} (${risk.level})`,
          "5. Security Policy: CHALLENGE (Step-up multi-factor authentication required)",
          `6. Audit Log: Event ${event.id} stored [is_simulation: true]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 7. REVOKED TOKEN RE-USE (NEW)
    // ------------------------------------------------------------------
    case "SIMULATE_REVOKED_TOKEN": {
      // Generate a simulated revoked token representation (Never a real user's token)
      const simRevokedTokenId = "sim_refr_revoked_" + Math.random().toString(36).substring(2, 10);
      const maskedToken = simRevokedTokenId.substring(0, 18) + "••••••••••";
      const attackerIp = "194.26.29.112";

      // Create a simulated already-revoked session record to represent past termination
      const revokedSessId = "sim_revoked_sess_" + Math.random().toString(36).substring(2, 8);
      const revokedSession = await dbRepository.createSession({
        user_id: auth.user.id,
        session_identifier: revokedSessId,
        refresh_token_hash: hashRefreshToken(simRevokedTokenId),
        previous_refresh_token_hashes: [],
        rotation_count: 3,
        ip_address: attackerIp,
        user_agent: "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
        location: "Warsaw, Poland",
        expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        revoked_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        risk_score: 65,
        risk_level: "HIGH",
        status: "Revoked",
      });

      // Risk Engine evaluates tokenRevoked (+55) + ipChanged (+10) -> Score: 65 (HIGH)
      const risk = calculateRisk({ tokenRevoked: true, ipChanged: true });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: revokedSession.id,
        eventType: "TOKEN_REVOKED_ATTEMPT",
        severity: "HIGH",
        riskScore: risk.score,
        ipAddress: attackerIp,
        location: "Warsaw, Poland",
        description: `Simulated authentication attempt with revoked credentials [${maskedToken}] against session [${revokedSessId}].`,
        reason: "Presentation of credentials belonging to a session marked explicitly as Revoked (+65 pts).",
        actionTaken: "CHALLENGE: Inbound request rejected with HTTP 401 Unauthorized; incident logged.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_REVOKED_TOKEN",
          simulatedTokenId: maskedToken,
          sessionId: revokedSession.id,
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated authentication attempt using revoked token [${maskedToken}]. Request rejected (Risk: ${risk.score} ${risk.level}).`,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        action: risk.action,
        stages: [
          `1. Simulation Triggered: Authentication with Revoked Token [${maskedToken}] [DEMO/SIMULATION]`,
          `2. Detection Engine: Session [${revokedSessId}] queried -> Status is explicitly 'Revoked'`,
          `3. Security Gate: Rejected authorization header immediately (HTTP 401 Unauthorized)`,
          `4. Risk Engine: Revoked token penalty (+55) + Rogue IP (+10) -> Score: ${risk.score} (${risk.level})`,
          "5. Security Policy: CHALLENGE / BLOCK (Request denied; incident alerted to SOC console)",
          `6. Audit Log: Event ${event.id} stored [is_simulation: true]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 8. REFRESH TOKEN REPLAY & THEFT ATTACK (Complete Detection Pipeline)
    // ------------------------------------------------------------------
    case "SIMULATE_TOKEN_REUSE":
    case "SIMULATE_TOKEN_REPLAY": {
      // 1. Generate a clearly marked simulated previously-rotated refresh-token identifier
      // NEVER use or display a real authentication token!
      const simRawToken = "sim_refr_rot_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const simRotatedHash = hashRefreshToken(simRawToken);
      const maskedTokenId = simRawToken.substring(0, 16) + "••••••••";

      // 2. Setup a simulated compromised session with the old hash in its token family vault
      const devId = "dev_sim_compromised_" + Math.random().toString(36).substring(2, 7);
      const device = await dbRepository.upsertDevice({
        user_id: auth.user.id,
        device_identifier: devId,
        device_name: "Simulated Mobile Endpoint",
        browser: "Chrome Mobile 126",
        operating_system: "Android 14",
        device_type: "Mobile",
        trusted: false,
      });

      const sId = "sim_sess_" + Math.random().toString(36).substring(2, 8);
      const currentActiveToken = "sim_refr_act_" + Math.random().toString(36).substring(2, 10);
      const targetSession = await dbRepository.createSession({
        user_id: auth.user.id,
        session_identifier: sId,
        refresh_token_hash: hashRefreshToken(currentActiveToken),
        previous_refresh_token_hashes: [simRotatedHash], // Old rotated hash stored in vault
        rotation_count: 2,
        device_id: device.id,
        ip_address: "198.51.100.77",
        user_agent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        location: "Bucharest, Romania",
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        risk_score: 40,
        risk_level: "MEDIUM",
        status: "Active",
      });

      // 3. Send the simulated reuse event through the detection engine
      // Detection: Inbound hash matches vaulted previous_refresh_token_hashes!
      const inboundHash = hashRefreshToken(simRawToken);
      const isReplayDetected = (targetSession.previous_refresh_token_hashes || []).includes(inboundHash);

      if (!isReplayDetected) {
        return NextResponse.json({ error: "Detection engine failure" }, { status: 500 });
      }

      // 4. Detected TOKEN_REPLAY_DETECTED
      // 5. Calculate a CRITICAL risk score between 90 and 100:
      // tokenReused (+40) + deviceChanged (+20) + locationChanged (+20) + unusualActivity (+15) = 95
      const risk = calculateRisk({
        tokenReused: true,
        deviceChanged: true,
        locationChanged: true,
        unusualActivity: true,
      });

      const stolenIp = "45.33.32.156";
      const stolenLocation = "Bucharest, Romania";

      // 7. Apply the security policy: REVOKE
      // 8. Mark the simulated session as revoked
      await dbRepository.revokeSession(targetSession.id, auth.user.id);

      // 9. Create a security event in the database with is_simulation=true
      // (This also creates an Alert in the database because severity is CRITICAL)
      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: targetSession.id,
        eventType: "TOKEN_REPLAY_DETECTED",
        severity: "CRITICAL",
        riskScore: risk.score, // 95
        ipAddress: stolenIp,
        location: stolenLocation,
        description: `CRITICAL: Stolen previously rotated refresh token [${maskedTokenId}] re-presented for session [${targetSession.session_identifier}]. Session automatically revoked.`,
        reason: "A previously rotated refresh-token identifier was presented again by an unauthorized host.",
        actionTaken: "REVOKE: Compromised session revoked immediately; entire token family terminated.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_TOKEN_REPLAY",
          sessionIdentifier: targetSession.session_identifier,
          simulatedTokenId: maskedTokenId,
          attackerIp: stolenIp,
          attackerLocation: stolenLocation,
        },
      });

      // 10. Return complete execution pipeline, risk factors, policy, and simulation flags
      return NextResponse.json({
        success: true,
        scenario: "SIMULATE_TOKEN_REPLAY",
        simulationMode: true,
        message: `Token Replay detected on session [${targetSession.session_identifier}]! Rotated token [${maskedTokenId}] caught. Session terminated immediately (Score: ${risk.score}/100 CRITICAL).`,
        simulatedTokenIdentifier: maskedTokenId,
        detectedEventType: "TOKEN_REPLAY_DETECTED",
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.factors,
        securityAction: risk.action,
        revokedSessionId: targetSession.id,
        revokedSessionIdentifier: targetSession.session_identifier,
        eventId: event.id,
        stages: [
          `1. Simulation Triggered: Adversary presents stolen rotated token [${maskedTokenId}] [DEMO/SIMULATION]`,
          `2. Detection Engine: Inbound SHA-256 digest matched vaulted previous hash in session tree [${targetSession.session_identifier}]`,
          `3. Threat Classification: Confirmed TOKEN_REPLAY_DETECTED (OAuth 2.0 BCP Violation)`,
          `4. Risk Engine: Token Replay (+40) + Rogue Device (+20) + Geo Shift (+20) + Burst (+15) -> Score: ${risk.score} (${risk.level})`,
          "5. Security Policy Applied: REVOKE (Target session terminated immediately & token family invalidated)",
          `6. Audit & Alert: Event ${event.id} stored [is_simulation: true] & CRITICAL alert dispatched to SOC console`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 9. LEGITIMATE TOKEN ROTATION (RFC 6749)
    // ------------------------------------------------------------------
    case "SIMULATE_TOKEN_ROTATION": {
      const currentRotCount = (auth.session.rotation_count || 0) + 1;
      const newRef = generateOpaqueRefreshToken();
      const newRefHash = hashRefreshToken(newRef);
      const prevHashes = [...(auth.session.previous_refresh_token_hashes || []), auth.session.refresh_token_hash];

      await dbRepository.updateSessionActivity(auth.session.id, {
        rotation_count: currentRotCount,
        refresh_token_hash: newRefHash,
        previous_refresh_token_hashes: prevHashes,
        last_rotated_at: new Date().toISOString(),
      });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: auth.session.id,
        eventType: "TOKEN_ROTATED",
        severity: "INFO",
        riskScore: 0,
        ipAddress: auth.session.ip_address,
        deviceId: auth.session.device_id,
        userAgent: auth.session.user_agent,
        location: auth.session.location,
        description: `Legitimate refresh-token rotation executed (Cycle #${currentRotCount}). Prior hash retired into replay detection cache.`,
        reason: "Standard token expiration prevention and credential rotation.",
        actionTaken: "ALLOW: New 15m access token issued; old refresh token retired.",
        isSimulation: true,
        metadata: { scenario: "SIMULATE_TOKEN_ROTATION", rotationCount: currentRotCount },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated successful refresh-token rotation (Cycle #${currentRotCount}). Old token hash safely vaulted for replay detection.`,
        riskScore: 0,
        riskLevel: "LOW",
        riskFactors: [],
        action: "ALLOW",
        stages: [
          "1. Simulation Triggered: Legitimate Token Refresh Rotation [DEMO/SIMULATION]",
          "2. Cryptographic Engine: Generated new high-entropy SHA-256 token hash",
          `3. Token Family: Added old hash to replay history cache (${prevHashes.length} vaulted)`,
          "4. Security Policy: ALLOW (Issue fresh short-lived access credentials)",
          `5. Audit Log: Event ${event.id} stored [is_simulation: true]`,
          "6. Feed Synchronization: SOC dashboard notified of rotation",
        ],
      });
    }

    default:
      return NextResponse.json({ error: "Unknown simulation scenario" }, { status: 400 });
  }
}
