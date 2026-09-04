import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { dbRepository } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "No session cookie found" }, { status: 400 });
    }

    const session = await dbRepository.getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await dbRepository.reactivateSession(sessionId, session.user_id);

    return NextResponse.json({
      success: true,
      message: "Session reactivated successfully. You may continue testing.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to reactivate session" }, { status: 500 });
  }
}
