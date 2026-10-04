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
    // 1. NORMAL LOGIN
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
        actionTaken: "ALLOW: Session permitted without challenge.",
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
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Baseline Authenticated Login",
          "2. Telemetry Ingested: Familiar IP & Device Fingerprint",
          "3. Risk Engine: Evaluated 0 anomaly points",
          "4. Security Policy: ALLOW",
          `5. Audit Log: Event ${event.id} stored [SIMULATION]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 2. NEW DEVICE
    // ------------------------------------------------------------------
    case "SIMULATE_NEW_DEVICE": {
      const randomBrowsers = ["Firefox on Android", "Opera GX on macOS", "Brave on Linux", "Safari on iOS"];
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

      const risk = calculateRisk({ deviceChanged: true });
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
        reason: "Device fingerprint not found in enrolled trusted devices (+20).",
        actionTaken: "MONITOR: Device registered as unverified; security alert created.",
        isSimulation: true,
        metadata: { scenario: "SIMULATE_NEW_DEVICE", deviceName: device.device_name },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated new device login: ${device.device_name} (Risk: ${risk.level}, +${risk.score} pts)`,
        riskScore: risk.score,
        riskLevel: risk.level,
        action: risk.action,
        createdSessionId: session.id,
        stages: [
          "1. Simulation Triggered: Unrecognized Device Fingerprint",
          `2. Telemetry Ingested: Browser: ${device.browser}, OS: ${device.operating_system}`,
          `3. Risk Engine: New device penalty (+20 pts) -> Score: ${risk.score}`,
          "4. Security Policy: MONITOR & ALERT",
          `5. Audit Log: Event ${event.id} stored [SIMULATION]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 3. NORMAL IP CHANGE
    // ------------------------------------------------------------------
    case "SIMULATE_IP_CHANGE":
    case "SIMULATE_NEW_IP": {
      const newIp = "49.205.142.88";
      const newLoc = "Hyderabad, IN (Mobile Carrier IP)";
      const risk = calculateRisk({ ipChanged: true });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: auth.session.id,
        eventType: "IP_CHANGED",
        severity: "LOW",
        riskScore: risk.score,
        ipAddress: newIp,
        deviceId: auth.session.device_id,
        userAgent: auth.session.user_agent,
        location: newLoc,
        description: `Simulated dynamic IP change to ${newIp} within local metropolitan area.`,
        reason: "Cellular data carrier / ISP IP reassignment (+10).",
        actionTaken: "ALLOW: Normal IP transition noted in audit trail.",
        isSimulation: true,
        metadata: { scenario: "SIMULATE_IP_CHANGE", previousIp: auth.session.ip_address, newIp },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated benign network IP transition to ${newIp} (Risk: ${risk.level})`,
        riskScore: risk.score,
        riskLevel: risk.level,
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Client IP Address Shift",
          `2. Telemetry Ingested: Old IP: ${auth.session.ip_address} -> New IP: ${newIp}`,
          `3. Geo-Analysis: Local velocity normal (~10 km) -> Score: ${risk.score}`,
          "4. Security Policy: ALLOW & LOG",
          `5. Audit Log: Event ${event.id} stored [SIMULATION]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 4. TOKEN ROTATION (Legitimate OAuth 2.0 Cycle)
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
        actionTaken: "New 15m access token issued; old refresh token retired.",
        isSimulation: true,
        metadata: { scenario: "SIMULATE_TOKEN_ROTATION", rotationCount: currentRotCount },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated successful refresh-token rotation (Cycle #${currentRotCount}). Old token hash safely vaulted for replay detection.`,
        stages: [
          "1. Simulation Triggered: Legitimate Token Refresh Rotation",
          `2. Cryptographic Engine: Generated new SHA-256 token hash`,
          `3. Token Family: Added old hash to replay history cache (${prevHashes.length} vaulted)`,
          "4. Security Policy: ALLOW (Issue fresh short-lived access credentials)",
          `5. Audit Log: Event ${event.id} stored [SIMULATION]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 5. REFRESH TOKEN REPLAY & THEFT ATTACK
    // ------------------------------------------------------------------
    case "SIMULATE_TOKEN_REUSE":
    case "SIMULATE_TOKEN_REPLAY": {
      const sessions = await dbRepository.getSessionsByUser(auth.user.id);
      let targetSession = sessions.find((s) => s.id !== auth.session.id && s.status === "Active");

      // If no other session exists, create a simulated target session so the current operator is not locked out
      if (!targetSession) {
        const devId = "dev_sim_compromised_" + Math.random().toString(36).substring(2, 7);
        const device = await dbRepository.upsertDevice({
          user_id: auth.user.id,
          device_identifier: devId,
          device_name: "Simulated Mobile Endpoint",
          browser: "Chrome Mobile",
          operating_system: "Android",
          device_type: "Mobile",
          trusted: false,
        });

        const sId = generateSessionIdentifier();
        const rToken = generateOpaqueRefreshToken();
        targetSession = await dbRepository.createSession({
          user_id: auth.user.id,
          session_identifier: sId,
          refresh_token_hash: hashRefreshToken(rToken),
          previous_refresh_token_hashes: ["old_hash_" + Math.random().toString(36).substring(2, 10)],
          rotation_count: 1,
          device_id: device.id,
          ip_address: "198.51.100.77",
          user_agent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
          location: "Bucharest, Romania",
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          risk_score: 40,
          risk_level: "MEDIUM",
          status: "Active",
        });
      }

      const stolenIp = "45.33.32.156";
      const stolenLocation = "Bucharest, Romania";
      const criticalRiskScore = 95;

      // Automatically revoke the compromised simulated session
      await dbRepository.revokeSession(targetSession.id, auth.user.id);

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: targetSession.id,
        eventType: "TOKEN_REPLAY_DETECTED",
        severity: "CRITICAL",
        riskScore: criticalRiskScore,
        ipAddress: stolenIp,
        location: stolenLocation,
        description: `CRITICAL: Stolen previously rotated refresh token re-presented for session [${targetSession.session_identifier}]. Session automatically revoked.`,
        reason: "A previously rotated refresh-token identifier was presented again.",
        actionTaken: "Session revoked immediately; access blocked.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_TOKEN_REPLAY",
          sessionIdentifier: targetSession.session_identifier,
          attackerIp: stolenIp,
          attackerLocation: stolenLocation,
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated Token Theft & Replay Attack on session [${targetSession.session_identifier}]. Replay caught: session terminated immediately (Risk: 95/100 CRITICAL)!`,
        revokedSessionId: targetSession.id,
        stages: [
          "1. Simulation Triggered: Attacker attempts replay of stolen, rotated refresh token",
          `2. Detection Engine: Hash matches vaulted previous token hash in session tree`,
          "3. Risk Engine: Token Replay (+40 pts) + Rogue Origin (+40 pts) -> Score: 95 (CRITICAL)",
          "4. Automated Response: SESSION IMMEDIATELY REVOKED & TOKENS INVALIDATED",
          `5. Audit Log: CRITICAL Event ${event.id} stored [SIMULATION]`,
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

      const risk = calculateRisk({ impossibleTravel: true, ipChanged: true });

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
        reason: "Geographic displacement speed exceeds plausible physical aircraft transit (+30).",
        actionTaken: "CHALLENGE: Step-up authentication required; high-priority alert issued.",
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
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Rapid Geographic Relocation",
          `2. Telemetry Ingested: Origin: ${auth.session.location} -> Current: ${target.loc} (20 mins elapsed)`,
          `3. Velocity Engine: Displacement of ~${travel.estimatedDistanceKm} km requires ${travel.requiredSpeedKmH} km/h (> 800 km/h threshold)`,
          `4. Risk Engine: Impossible Travel (+30 pts) + New IP (+10 pts) -> Score: ${risk.score}`,
          "5. Security Policy: CHALLENGE / STEP-UP RE-AUTHENTICATION REQUIRED",
          `6. Audit Log: Event ${event.id} stored [SIMULATION]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 7. MULTIPLE FAILED LOGINS
    // ------------------------------------------------------------------
    case "SIMULATE_FAILED_LOGINS": {
      const risk = calculateRisk({ failedAttempts: 4 });
      const attackerIp = "198.51.100.99";

      const event = await eventEngine.emit({
        userId: auth.user.id,
        eventType: "LOGIN_FAILED",
        severity: "HIGH",
        riskScore: risk.score,
        ipAddress: attackerIp,
        userAgent: "Python-Requests/2.31.0 Credential-Brute-Force",
        location: "Kyiv, Ukraine",
        description: "Simulated repeated failed password attempts (4 consecutive failures in 2 mins).",
        reason: "Credential stuffing or brute-force dictionary attempt detected (+20).",
        actionTaken: "CHALLENGE: Origin IP temporarily throttled; security alert dispatched.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_FAILED_LOGINS",
          attempts: 4,
          attackerIp,
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated credential brute-force attack: 4 rapid password failures from ${attackerIp} (Risk: ${risk.score} ${risk.level})`,
        riskScore: risk.score,
        riskLevel: risk.level,
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Multiple Failed Authentication Attempts",
          `2. Telemetry Ingested: 4 consecutive failed logins from ${attackerIp}`,
          `3. Risk Engine: Repeated failure penalty (+20 pts) -> Score: ${risk.score}`,
          "4. Security Policy: CHALLENGE & RATE-LIMIT ORIGIN",
          `5. Audit Log: Event ${event.id} stored [SIMULATION]`,
        ],
      });
    }

    // ------------------------------------------------------------------
    // 8. SUSPICIOUS BOT / CRAWLER SESSION
    // ------------------------------------------------------------------
    case "SIMULATE_SUSPICIOUS_ACTIVITY": {
      const risk = calculateRisk({ suspiciousUserAgent: true, unusualActivity: true });

      const event = await eventEngine.emit({
        userId: auth.user.id,
        sessionId: auth.session.id,
        eventType: "SUSPICIOUS_ACTIVITY",
        severity: "HIGH",
        riskScore: risk.score,
        ipAddress: auth.session.ip_address,
        deviceId: auth.session.device_id,
        userAgent: "HeadlessChrome/128.0.0.0 (Automated Scraper)",
        location: auth.session.location,
        description: "Simulated bot/crawler scraping activity: Headless Chrome signature & request burst rate.",
        reason: "Altered headless client User-Agent and rapid abnormal request frequency (+25).",
        actionTaken: "CHALLENGE: Session placed under rate-limiting and bot challenge inspection.",
        isSimulation: true,
        metadata: {
          scenario: "SIMULATE_SUSPICIOUS_ACTIVITY",
          signature: "HeadlessChrome WebDriver",
        },
      });

      return NextResponse.json({
        success: true,
        scenario,
        simulationMode: true,
        message: `Simulated bot scraping & headless browser anomaly (Risk: ${risk.score} ${risk.level})`,
        riskScore: risk.score,
        riskLevel: risk.level,
        action: risk.action,
        stages: [
          "1. Simulation Triggered: Headless Browser / Bot Scraping",
          "2. Telemetry Ingested: Altered User-Agent 'HeadlessChrome' & request burst",
          `3. Risk Engine: Abnormal session cadence & scraper traits (+25 pts) -> Score: ${risk.score}`,
          "4. Security Policy: CHALLENGE / BOT INSPECTION",
          `5. Audit Log: Event ${event.id} stored [SIMULATION]`,
        ],
      });
    }

    default:
      return NextResponse.json({ error: "Unknown simulation scenario" }, { status: 400 });
  }
}
