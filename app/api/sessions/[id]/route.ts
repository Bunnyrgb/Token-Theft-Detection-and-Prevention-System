import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { maskTokenIdentifier } from "@/lib/utils";
import { extractClientTelemetry } from "@/lib/security/fingerprint";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const session = await dbRepository.getSessionById(params.id);
  if (!session || session.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Session not found or access denied" }, { status: 404 });
  }

  return NextResponse.json({
    session: {
      id: session.id,
      session_identifier: maskTokenIdentifier(session.session_identifier),
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      location: session.location,
      created_at: session.created_at,
      last_used_at: session.last_used_at,
      expires_at: session.expires_at,
      revoked_at: session.revoked_at,
      risk_score: session.risk_score,
      risk_level: session.risk_level,
      status: session.status,
      is_current: session.id === auth.session.id,
      device: session.device,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const session = await dbRepository.getSessionById(params.id);
  if (!session || session.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Session not found or access denied" }, { status: 404 });
  }

  await dbRepository.revokeSession(params.id, auth.user.id);
  const telemetry = extractClientTelemetry(req.headers);

  await dbRepository.createSecurityEvent({
    user_id: auth.user.id,
    session_id: params.id,
    event_type: "SESSION_REVOKED",
    severity: "INFO",
    risk_score: 0,
    ip_address: telemetry.ipAddress,
    metadata: {
      revokedSessionId: params.id,
      manualRevocation: true,
    },
  });

  return NextResponse.json({ success: true, message: "Session revoked successfully" });
}
