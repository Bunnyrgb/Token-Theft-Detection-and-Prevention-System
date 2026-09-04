import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { extractClientTelemetry } from "@/lib/security/fingerprint";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const body = await req.json();
  const { currentPassword, newPassword, confirmPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
  }

  const isValid = await verifyPassword(currentPassword, auth.user.password_hash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
  }

  const newHash = await hashPassword(newPassword);
  await dbRepository.updateUserPassword(auth.user.id, newHash);

  const telemetry = extractClientTelemetry(req.headers);
  await dbRepository.createSecurityEvent({
    user_id: auth.user.id,
    session_id: auth.session.id,
    event_type: "RISK_INCREASED",
    severity: "INFO",
    risk_score: 0,
    ip_address: telemetry.ipAddress,
    metadata: { action: "PASSWORD_CHANGED" },
  });

  await dbRepository.createAlert({
    user_id: auth.user.id,
    title: "Account Password Updated",
    message: "Your account password was successfully changed.",
    severity: "INFO",
  });

  return NextResponse.json({ success: true, message: "Password updated successfully" });
}
