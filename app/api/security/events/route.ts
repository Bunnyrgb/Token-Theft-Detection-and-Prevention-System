import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { eventEngine } from "@/lib/security/event-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const eventType = url.searchParams.get("eventType");
  const severity = url.searchParams.get("severity");
  const mode = url.searchParams.get("mode") || "all"; // 'production', 'simulation', or 'all'

  let filterSimulation: boolean | undefined = undefined;
  if (mode === "production") filterSimulation = false;
  if (mode === "simulation") filterSimulation = true;

  let events = await dbRepository.getSecurityEventsByUser(auth.user.id, limit, filterSimulation);

  if (eventType && eventType !== "ALL") {
    events = events.filter((e) => e.event_type === eventType);
  }

  if (severity && severity !== "ALL") {
    events = events.filter((e) => e.severity === severity);
  }

  // Enrich with AI explanations
  const enrichedEvents = events.map((e) => ({
    ...e,
    explanation: eventEngine.explainEvent(e),
  }));

  return NextResponse.json({ events: enrichedEvents });
}
