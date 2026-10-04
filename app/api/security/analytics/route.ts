import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "all";
  const filterSim = mode === "production" ? false : mode === "simulation" ? true : undefined;

  const [events, devices, sessions] = await Promise.all([
    dbRepository.getSecurityEventsByUser(auth.user.id, 100, filterSim),
    dbRepository.getDevicesByUser(auth.user.id),
    dbRepository.getSessionsByUser(auth.user.id),
  ]);

  const sortedEvents = [...events].reverse();
  const riskTimeline = sortedEvents.map((e, idx) => {
    const d = new Date(e.created_at);
    return {
      index: idx + 1,
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
      riskScore: e.risk_score || 0,
      eventType: e.event_type,
      severity: e.severity,
      isSimulation: e.is_simulation,
    };
  });

  if (riskTimeline.length === 0) {
    riskTimeline.push({
      index: 1,
      time: "Initial",
      date: "Today",
      riskScore: 0,
      eventType: "SESSION_CREATED",
      severity: "INFO",
      isSimulation: false,
    });
  }

  // 1. Events distribution by type
  const eventTypeMap: Record<string, number> = {};
  events.forEach((e) => {
    eventTypeMap[e.event_type] = (eventTypeMap[e.event_type] || 0) + 1;
  });
  const eventDistribution = Object.entries(eventTypeMap).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  // 2. Risk Level Distribution (LOW, MEDIUM, HIGH, CRITICAL)
  const riskLevelMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  events.forEach((e) => {
    const sev = e.severity;
    if (sev === "CRITICAL") riskLevelMap.CRITICAL++;
    else if (sev === "HIGH") riskLevelMap.HIGH++;
    else if (sev === "MEDIUM") riskLevelMap.MEDIUM++;
    else riskLevelMap.LOW++;
  });
  const riskLevelDistribution = Object.entries(riskLevelMap).map(([name, value]) => ({
    name,
    value,
  }));

  // 3. Session Status Distribution (Active, Suspicious, Revoked, Expired)
  const sessionStatusMap = { Active: 0, Suspicious: 0, Revoked: 0, Expired: 0 };
  sessions.forEach((s) => {
    const st = s.status || "Active";
    if (st in sessionStatusMap) {
      sessionStatusMap[st as keyof typeof sessionStatusMap]++;
    }
  });
  const sessionStatusDistribution = Object.entries(sessionStatusMap).map(([name, value]) => ({
    name,
    value,
  }));

  // 4. Token Rotation & Replay Activity
  const totalRotations = sessions.reduce((acc, s) => acc + (s.rotation_count || 0), 0);
  const tokenReplaysCaught = events.filter((e) => e.event_type === "TOKEN_REPLAY_DETECTED" || e.event_type === "TOKEN_REUSE_DETECTED").length;

  const deviceTypeMap: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
  devices.forEach((d) => {
    const type = d.device_type || "Desktop";
    deviceTypeMap[type] = (deviceTypeMap[type] || 0) + 1;
  });
  const deviceDistribution = Object.entries(deviceTypeMap).map(([name, value]) => ({
    name,
    value: value || (name === "Desktop" ? 1 : 0),
  }));

  const totalEvents = events.length || 1;
  const criticalCount = events.filter((e) => e.severity === "CRITICAL" || e.event_type === "TOKEN_REUSE_DETECTED").length;
  const suspiciousCount = events.filter((e) => e.severity === "MEDIUM" || e.severity === "HIGH").length;
  const normalCount = Math.max(0, totalEvents - criticalCount - suspiciousCount);

  const normalPct = Math.round((normalCount / totalEvents) * 100);
  const suspiciousPct = Math.round((suspiciousCount / totalEvents) * 100);
  const blockedPct = Math.max(0, 100 - normalPct - suspiciousPct);

  return NextResponse.json({
    riskTimeline,
    eventDistribution,
    riskLevelDistribution,
    sessionStatusDistribution,
    deviceDistribution,
    threatActivity: {
      normal: normalPct,
      suspicious: suspiciousPct,
      blocked: blockedPct,
    },
    tokenRotationActivity: {
      totalRotations,
      tokenReplaysCaught,
      activeRotatedSessions: sessions.filter((s) => (s.rotation_count || 0) > 0).length,
    },
    summary: {
      totalEvents: events.length,
      totalDevices: devices.length,
      activeSessions: sessions.filter((s) => s.status === "Active").length,
      highRiskSessions: sessions.filter((s) => s.risk_score >= 50 && s.status === "Active").length,
      revokedSessions: sessions.filter((s) => s.status === "Revoked").length,
      tokenReplays: tokenReplaysCaught,
    },
  });
}
