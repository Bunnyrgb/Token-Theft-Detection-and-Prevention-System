import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const body = await req.json();
  const { read, resolved } = body;

  const success = await dbRepository.updateAlertStatus(auth.user.id, params.id, {
    read,
    resolved,
  });

  if (!success) {
    return NextResponse.json({ error: "Alert not found or update failed" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
