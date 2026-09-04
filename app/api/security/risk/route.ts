import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { calculateRisk } from "@/lib/risk-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const sessions = await dbRepository.getSessionsByUser(auth.user.id);
  const activeSessions = sessions.filter((s) => s.status === "Active");
  const suspiciousSessions = sessions.filter((s) => s.status === "Suspicious" || s.risk_score >= 30);
  const events = await dbRepository.getSecurityEventsByUser(auth.user.id, 20);

  const maxSessionRisk = sessions.reduce((max, s) => Math.max(max, s.risk_score), 0);
  const avgRisk = sessions.length ? Math.round(sessions.reduce((sum, s) => sum + s.risk_score, 0) / sessions.length) : 0;

  return NextResponse.json({
    overallRiskScore: maxSessionRisk,
    averageRiskScore: avgRisk,
    activeSessionsCount: activeSessions.length,
    suspiciousSessionsCount: suspiciousSessions.length,
    totalSessionsCount: sessions.length,
    recentEvents: events.slice(0, 5),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;

  const body = await req.json();
  const evaluation = calculateRisk(body);

  return NextResponse.json({ evaluation });
}
