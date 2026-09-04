import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { maskTokenIdentifier } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const sessions = await dbRepository.getSessionsByUser(auth.user.id);

  const safeSessions = sessions.map((s) => ({
    id: s.id,
    session_identifier: maskTokenIdentifier(s.session_identifier),
    ip_address: s.ip_address,
    user_agent: s.user_agent,
    location: s.location,
    created_at: s.created_at,
    last_used_at: s.last_used_at,
    expires_at: s.expires_at,
    revoked_at: s.revoked_at,
    risk_score: s.risk_score,
    risk_level: s.risk_level,
    status: s.status,
    is_current: s.id === auth.session.id,
    device: s.device
      ? {
          id: s.device.id,
          device_name: s.device.device_name,
          browser: s.device.browser,
          operating_system: s.device.operating_system,
          device_type: s.device.device_type,
          trusted: s.device.trusted,
        }
      : undefined,
  }));

  return NextResponse.json({ sessions: safeSessions });
}
