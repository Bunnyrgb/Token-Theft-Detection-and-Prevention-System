import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const devices = await dbRepository.getDevicesByUser(auth.user.id);
  return NextResponse.json({ devices });
}
