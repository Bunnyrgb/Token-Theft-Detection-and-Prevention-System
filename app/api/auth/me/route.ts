import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/auth/cookies";
import { sessionManager } from "@/lib/auth/session-manager";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = await sessionManager.validateRequestSession(accessToken);
    if (!auth.valid || !auth.user || !auth.session) {
      return NextResponse.json({ error: auth.error || "Session invalid or expired" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        created_at: auth.user.created_at,
      },
      session: {
        id: auth.session.id,
        session_identifier: auth.session.session_identifier,
        risk_score: auth.session.risk_score,
        risk_level: auth.session.risk_level,
        status: auth.session.status,
        created_at: auth.session.created_at,
        last_used_at: auth.session.last_used_at,
      },
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
