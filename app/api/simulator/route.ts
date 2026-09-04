import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { generateOpaqueRefreshToken, hashRefreshToken, generateSessionIdentifier } from "@/lib/auth/jwt";
import { calculateRisk } from "@/lib/risk-engine";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const body = await req.json();
  const { scenario } = body;

  switch (scenario) {
    case "SIMULATE_NEW_DEVICE": {
      const devTypes = ["Mobile", "Tablet", "Desktop"] as const;
      const randomType = devTypes[Math.floor(Math.random() * devTypes.length)];
      const randomBrowsers = ["Firefox Android", "Opera GX macOS", "Brave Linux", "Safari iOS"];
      const randomBrowser = randomBrowsers[Math.floor(Math.random() * randomBrowsers.length)];
      const randomIdentifier = "dev_sim_" + Math.random().toString(36).substring(2, 10);

      const device = await dbRepository.upsertDevice({
        user_id: auth.user.id,
        device_identifier: randomIdentifier,
        device_name: `Simulated ${randomBrowser}`,
        browser: randomBrowser,
        operating_system: randomBrowser.includes("macOS") ? "macOS" : randomBrowser.includes("Linux") ? "Linux" : "Android",
        device_type: randomType,
        trusted: false,
      });

      const risk = calculateRisk({ deviceChanged: true });
      const sessId = generateSessionIdentifier();
      const refToken = generateOpaqueRefreshToken();

      const session = await dbRepository.createSession({
        user_id: auth.user.id,
        session_identifier: sessId,
        refresh_token_hash: hashRefreshToken(refToken),
        device_id: device.id,
        ip_address: "198.51.100.42",
        user_agent: `Mozilla/5.0 (${randomBrowser})`,
        location: "Frankfurt, Germany",
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        risk_score: risk.score,
        risk_level: risk.level,
        status: "Active",
      });

      await dbRepository.createSecurityEvent({
        user_id: auth.user.id,
        session_id: session.id,
        event_type: "NEW_DEVICE",
        severity: "MEDIUM",
        risk_score: risk.score,
        ip_address: "198.51.100.42",
        device_id: device.id,
        metadata: { scenario: "SIMULATED_NEW_DEVICE", deviceName: device.device_name },
      });

      await dbRepository.createAlert({
        user_id: auth.user.id,
        title: "Simulation: New Device Detected",
        message: `Simulated login from unknown device '${device.device_name}' from Frankfurt, Germany. Risk score: ${risk.score}`,
        severity: "MEDIUM",
      });

      return NextResponse.json({
        success: true,
        scenario,
        message: `Simulated unrecognized device login: ${device.device_name} (Risk: ${risk.level})`,
        createdSessionId: session.id,
      });
    }

    case "SIMULATE_NEW_IP": {
      const foreignIps = [
        { ip: "203.0.113.195", loc: "Tokyo, Japan" },
        { ip: "198.51.100.88", loc: "São Paulo, Brazil" },
        { ip: "185.220.101.5", loc: "Amsterdam, Netherlands (Tor Exit Node)" },
      ];
      const target = foreignIps[Math.floor(Math.random() * foreignIps.length)];
      const risk = calculateRisk({ ipChanged: true, locationChanged: true });

      await dbRepository.createSecurityEvent({
        user_id: auth.user.id,
        session_id: auth.session.id,
        event_type: "NEW_IP",
        severity: "MEDIUM",
        risk_score: risk.score,
        ip_address: target.ip,
        device_id: auth.session.device_id,
        metadata: { location: target.loc, originalIp: auth.session.ip_address },
      });

      await dbRepository.createAlert({
        user_id: auth.user.id,
        title: "Simulation: Geographic Anomaly / New IP",
        message: `Rapid location shift observed: IP ${target.ip} (${target.loc}). Risk evaluated at ${risk.score} (${risk.level}).`,
        severity: "HIGH",
      });

      return NextResponse.json({
        success: true,
        scenario,
        message: `Simulated impossible-travel IP anomaly from ${target.loc} [${target.ip}]`,
      });
    }

    case "SIMULATE_TOKEN_REUSE": {
      const sessions = await dbRepository.getSessionsByUser(auth.user.id);
      let targetSession = sessions.find((s) => s.id !== auth.session.id && s.status === "Active");

      // If no other session exists, create a simulated vulnerable target session so the operator is not logged out!
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

      await dbRepository.createSecurityEvent({
        user_id: auth.user.id,
        session_id: targetSession.id,
        event_type: "TOKEN_REUSE_DETECTED",
        severity: "CRITICAL",
        risk_score: criticalRiskScore,
        ip_address: stolenIp,
        metadata: {
          incident: "REFRESH_TOKEN_REPLAY_ATTACK",
          stolenLocation,
          compromisedSessionIdentifier: targetSession.session_identifier,
          automatedAction: "SESSION_IMMEDIATELY_REVOKED",
        },
      });

      await dbRepository.createAlert({
        user_id: auth.user.id,
        title: "CRITICAL: Token Theft & Replay Attack Neutralized",
        message: `An invalidated refresh token for session ${targetSession.session_identifier} was replayed from ${stolenLocation} (${stolenIp}). The session was immediately terminated to safeguard user account!`,
        severity: "CRITICAL",
      });

      return NextResponse.json({
        success: true,
        scenario,
        message: `Simulated Token Theft & Replay Attack: Intercepted token reuse caught for session [${targetSession.session_identifier}]. Session automatically revoked, and CRITICAL SOC alert issued!`,
        revokedSessionId: targetSession.id,
      });
    }

    case "SIMULATE_SUSPICIOUS_ACTIVITY": {
      const risk = calculateRisk({ suspiciousUserAgent: true, unusualActivity: true });

      await dbRepository.createSecurityEvent({
        user_id: auth.user.id,
        session_id: auth.session.id,
        event_type: "SUSPICIOUS_ACTIVITY",
        severity: "HIGH",
        risk_score: risk.score,
        ip_address: auth.session.ip_address,
        metadata: {
          anomaly: "Headless Chrome / Python-Requests crawler fingerprint detected in session stream",
        },
      });

      await dbRepository.createAlert({
        user_id: auth.user.id,
        title: "Simulation: Suspicious Traffic Burst",
        message: `High velocity navigation and abnormal User-Agent header flagged. Risk score: ${risk.score}`,
        severity: "HIGH",
      });

      return NextResponse.json({
        success: true,
        scenario,
        message: `Simulated bot/crawler spoofing activity (Risk: ${risk.level})`,
      });
    }

    case "SIMULATE_CONCURRENT_SESSIONS": {
      const cities = [
        { city: "London, UK", ip: "51.140.22.1" },
        { city: "New York, USA", ip: "192.0.2.14" },
        { city: "Singapore, SG", ip: "103.253.14.9" },
      ];

      for (const item of cities) {
        const devId = "dev_sim_" + Math.random().toString(36).substring(2, 8);
        const dev = await dbRepository.upsertDevice({
          user_id: auth.user.id,
          device_identifier: devId,
          device_name: `Device (${item.city.split(",")[0]})`,
          browser: "Chrome",
          operating_system: "macOS",
          device_type: "Desktop",
          trusted: false,
        });

        const sId = generateSessionIdentifier();
        const rToken = generateOpaqueRefreshToken();
        await dbRepository.createSession({
          user_id: auth.user.id,
          session_identifier: sId,
          refresh_token_hash: hashRefreshToken(rToken),
          device_id: dev.id,
          ip_address: item.ip,
          user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          location: item.city,
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          risk_score: 55,
          risk_level: "MEDIUM",
          status: "Active",
        });
      }

      await dbRepository.createSecurityEvent({
        user_id: auth.user.id,
        session_id: auth.session.id,
        event_type: "RISK_INCREASED",
        severity: "HIGH",
        risk_score: 65,
        ip_address: auth.session.ip_address,
        metadata: { concurrentSessionCount: 4, reason: "Multiple global endpoints connected concurrently" },
      });

      await dbRepository.createAlert({
        user_id: auth.user.id,
        title: "Simulation: Concurrent Multi-Region Sessions",
        message: "Active sessions detected simultaneously across 3 global regions.",
        severity: "HIGH",
      });

      return NextResponse.json({
        success: true,
        scenario,
        message: "Simulated 3 concurrent global sessions and triggered multi-session risk alerts.",
      });
    }

    default:
      return NextResponse.json({ error: "Unknown simulation scenario" }, { status: 400 });
  }
}
