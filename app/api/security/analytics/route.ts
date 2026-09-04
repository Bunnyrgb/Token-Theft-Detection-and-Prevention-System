import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const [events, devices, sessions] = await Promise.all([
    dbRepository.getSecurityEventsByUser(auth.user.id, 100),
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
    });
  }

  const eventTypeMap: Record<string, number> = {};
  events.forEach((e) => {
    eventTypeMap[e.event_type] = (eventTypeMap[e.event_type] || 0) + 1;
  });
  const eventDistribution = Object.entries(eventTypeMap).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

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

  const dayMap: Record<string, number> = {};
  events
    .filter((e) => e.event_type === "LOGIN" || e.event_type === "TOKEN_CREATED")
    .forEach((e) => {
      const day = new Date(e.created_at).toLocaleDateString([], { weekday: "short" });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const loginActivity = weekDays.map((day) => ({
    day,
    logins: dayMap[day] || (day === new Date().toLocaleDateString([], { weekday: "short" }) ? 1 : 0),
  }));

  return NextResponse.json({
    riskTimeline,
    eventDistribution,
    deviceDistribution,
    threatActivity: {
      normal: normalPct,
      suspicious: suspiciousPct,
      blocked: blockedPct,
    },
    loginActivity,
    summary: {
      totalEvents: events.length,
      totalDevices: devices.length,
      activeSessions: sessions.filter((s) => s.status === "Active").length,
      revokedSessions: sessions.filter((s) => s.status === "Revoked").length,
    },
  });
}
