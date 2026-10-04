import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-guard";
import { dbRepository } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.success) return authResult.errorResponse;
  const { auth } = authResult;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "all";
  const filterSim = mode === "production" ? false : mode === "simulation" ? true : undefined;

  const alerts = await dbRepository.getAlertsByUser(auth.user.id, filterSim);
  return NextResponse.json({ alerts });
}
