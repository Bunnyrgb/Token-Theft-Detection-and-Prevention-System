import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { AuthTokenPayload } from "../types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tokenguard_super_secure_default_secret_key_32_chars_long"
);

// Access token: 15 minutes
const ACCESS_TOKEN_EXPIRY = "15m";
// Refresh token: 7 days
const REFRESH_TOKEN_EXPIRY = "7d";

/**
 * Generates a signed short-lived JWT Access Token
 */
export async function generateAccessToken(payload: Omit<AuthTokenPayload, "tokenType">): Promise<string> {
  return new SignJWT({ ...payload, tokenType: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Generates an opaque cryptographically-random Refresh Token
 */
export function generateOpaqueRefreshToken(): string {
  return "tg_ref_" + crypto.randomBytes(32).toString("hex");
}

/**
 * SHA-256 Hash of refresh token for safe storage in the database
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates unique safe session identifier (e.g. sess_8f42...91ac)
 */
export function generateSessionIdentifier(): string {
  return "sess_" + crypto.randomBytes(16).toString("hex");
}

/**
 * Verifies and decodes a JWT Access Token
 */
export async function verifyAccessToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}
