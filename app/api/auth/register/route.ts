import { NextRequest, NextResponse } from "next/server";
import { dbRepository } from "@/lib/database";
import { hashPassword } from "@/lib/auth/password";
import { extractClientTelemetry } from "@/lib/security/fingerprint";
import { sessionManager } from "@/lib/auth/session-manager";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required registration fields" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const existing = await dbRepository.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email address already exists" }, { status: 409 });
    }

    // Hash password securely with bcrypt
    const password_hash = await hashPassword(password);
    const user = await dbRepository.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
    });

    // Capture device telemetry and create initial secure session
    const telemetry = extractClientTelemetry(req.headers);
    const sessionResult = await sessionManager.createSessionForUser(user, telemetry);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      session: {
        id: sessionResult.session.id,
        session_identifier: sessionResult.session.session_identifier,
        status: sessionResult.session.status,
      },
    });

    return setAuthCookies(
      response,
      sessionResult.accessToken,
      sessionResult.refreshToken,
      sessionResult.session.id
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
  }
}
