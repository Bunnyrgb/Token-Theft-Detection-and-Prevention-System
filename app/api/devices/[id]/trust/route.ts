import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { extractClientTelemetry } from "@/lib/security/fingerprint";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const success = await dbRepository.setDeviceTrust(auth.user.id, params.id, true);
  if (!success) {
    return NextResponse.json({ error: "Device not found or update failed" }, { status: 404 });
  }

  const telemetry = extractClientTelemetry(req.headers);
  await dbRepository.createSecurityEvent({
    user_id: auth.user.id,
    session_id: auth.session.id,
    event_type: "RISK_INCREASED",
    severity: "INFO",
    risk_score: 0,
    ip_address: telemetry.ipAddress,
    device_id: params.id,
    metadata: { action: "DEVICE_TRUSTED", deviceId: params.id },
  });

  return NextResponse.json({ success: true, message: "Device marked as trusted" });
}
