import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const success = await dbRepository.reactivateSession(params.id, auth.user.id);
  if (!success) {
    return NextResponse.json({ error: "Session not found or update failed" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Session reactivated successfully" });
}
