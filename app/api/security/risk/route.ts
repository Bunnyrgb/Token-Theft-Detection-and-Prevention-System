import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { calculateRisk, applyRiskDecay } from "@/lib/risk-engine";
import { eventEngine } from "@/lib/security/event-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "all";
  const filterSim = mode === "production" ? false : mode === "simulation" ? true : undefined;

  const [sessions, events] = await Promise.all([
    dbRepository.getSessionsByUser(auth.user.id),
    dbRepository.getSecurityEventsByUser(auth.user.id, 20, filterSim),
  ]);

  const activeSessions = sessions.filter((s) => s.status === "Active");
  const suspiciousSessions = sessions.filter((s) => s.status === "Suspicious" || s.risk_score >= 30);
  const revokedSessions = sessions.filter((s) => s.status === "Revoked");

  // Calculate dynamic risk from active session events and decay
  let highestSessionRisk = 0;
  for (const s of activeSessions) {
    const hoursElapsed = Math.max(0, (Date.now() - new Date(s.last_used_at).getTime()) / (3600 * 1000));
    const decayedScore = applyRiskDecay(s.risk_score, hoursElapsed);
    if (decayedScore > highestSessionRisk) {
      highestSessionRisk = decayedScore;
    }
  }

  // Check recent anomalous events in the last 24 hours
  const now = Date.now();
  const recentEvents = events.filter((e) => (now - new Date(e.created_at).getTime()) < 24 * 3600 * 1000);

  const hasTokenReplay = recentEvents.some((e) => e.event_type === "TOKEN_REUSE_DETECTED" || e.event_type === "TOKEN_REPLAY_DETECTED");
  const hasImpossibleTravel = recentEvents.some((e) => e.event_type === "IMPOSSIBLE_TRAVEL");
  const hasNewDevice = recentEvents.some((e) => e.event_type === "DEVICE_CHANGED" || e.event_type === "NEW_DEVICE");
  const hasIpChange = recentEvents.some((e) => e.event_type === "IP_CHANGED" || e.event_type === "NEW_IP");
  const hasSuspiciousUA = recentEvents.some((e) => e.event_type === "SUSPICIOUS_ACTIVITY");
  const concurrentUsage = activeSessions.length >= 2;

  const dynamicEvaluation = calculateRisk({
    tokenReused: hasTokenReplay,
    impossibleTravel: hasImpossibleTravel,
    deviceChanged: hasNewDevice,
    ipChanged: hasIpChange,
    suspiciousUserAgent: hasSuspiciousUA,
    concurrentUsage,
  });

  const finalScore = Math.max(dynamicEvaluation.score, highestSessionRisk);
  const avgRisk = sessions.length ? Math.round(sessions.reduce((sum, s) => sum + s.risk_score, 0) / sessions.length) : 0;

  // Enrich recent events with explanations
  const enrichedRecentEvents = events.slice(0, 6).map((e) => ({
    ...e,
    explanation: eventEngine.explainEvent(e),
  }));

  return NextResponse.json({
    overallRiskScore: finalScore,
    averageRiskScore: avgRisk,
    riskLevel: dynamicEvaluation.level,
    factors: dynamicEvaluation.factors,
    reasons: dynamicEvaluation.reasons,
    explanation: dynamicEvaluation.explanation,
    action: dynamicEvaluation.action,
    activeSessionsCount: activeSessions.length,
    suspiciousSessionsCount: suspiciousSessions.length,
    revokedSessionsCount: revokedSessions.length,
    totalSessionsCount: sessions.length,
    recentEvents: enrichedRecentEvents,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;

  const body = await req.json();
  const evaluation = calculateRisk(body);

  return NextResponse.json({ evaluation });
}
