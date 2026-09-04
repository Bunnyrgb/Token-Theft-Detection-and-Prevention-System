import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const eventType = url.searchParams.get("eventType");
  const severity = url.searchParams.get("severity");

  let events = await dbRepository.getSecurityEventsByUser(auth.user.id, limit);

  if (eventType && eventType !== "ALL") {
    events = events.filter((e) => e.event_type === eventType);
  }

  if (severity && severity !== "ALL") {
    events = events.filter((e) => e.severity === severity);
  }

  return NextResponse.json({ events });
}
