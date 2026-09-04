import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { extractClientTelemetry } from "@/lib/security/fingerprint";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const count = await dbRepository.revokeAllOtherSessions(auth.user.id, auth.session.id);
  const telemetry = extractClientTelemetry(req.headers);

  await dbRepository.createSecurityEvent({
    user_id: auth.user.id,
    session_id: auth.session.id,
    event_type: "SESSION_REVOKED",
    severity: "MEDIUM",
    risk_score: 10,
    ip_address: telemetry.ipAddress,
    metadata: {
      action: "REVOKE_ALL_OTHER_SESSIONS",
      revokedCount: count,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Revoked ${count} other active session${count === 1 ? "" : "s"}.`,
    revokedCount: count,
  });
}
