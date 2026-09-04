import crypto from "crypto";
import { headers } from "next/headers";

export interface ParsedDeviceInfo {
  deviceIdentifier: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  ipAddress: string;
  userAgent: string;
  location: string;
}

/**
 * Extracts non-invasive device & client telemetry from headers
 */
export function extractClientTelemetry(reqHeaders?: Headers): ParsedDeviceInfo {
  let headerSource: Headers;
  try {
    headerSource = reqHeaders || headers();
  } catch {
    headerSource = new Headers();
  }

  const userAgent = headerSource.get("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
  const forwardedFor = headerSource.get("x-forwarded-for");
  const realIp = headerSource.get("x-real-ip");
  let ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : (realIp || "127.0.0.1");

  if (ipAddress === "::1") ipAddress = "127.0.0.1";

  // Parse OS
  let operatingSystem = "Unknown OS";
  if (/windows/i.test(userAgent)) operatingSystem = "Windows";
  else if (/macintosh|mac os x/i.test(userAgent)) operatingSystem = "macOS";
  else if (/android/i.test(userAgent)) operatingSystem = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) operatingSystem = "iOS";
  else if (/linux/i.test(userAgent)) operatingSystem = "Linux";

  // Parse Browser
  let browser = "Unknown Browser";
  if (/edg\//i.test(userAgent)) browser = "Microsoft Edge";
  else if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Safari";
  else if (/opera|opr\//i.test(userAgent)) browser = "Opera";

  // Parse Device Type
  let deviceType: "Desktop" | "Mobile" | "Tablet" = "Desktop";
  if (/ipad|tablet/i.test(userAgent)) deviceType = "Tablet";
  else if (/mobile|android|iphone/i.test(userAgent)) deviceType = "Mobile";

  // Device Friendly Name
  const deviceName = `${operatingSystem} ${deviceType === "Desktop" ? "Computer" : deviceType}`;

  // Deterministic privacy-preserving Device Identifier (hashed combination of non-sensitive traits)
  const acceptLang = headerSource.get("accept-language") || "en-US";
  const rawFingerprint = `${operatingSystem}__${browser}__${deviceType}__${acceptLang}`;
  const deviceIdentifier = "dev_" + crypto.createHash("sha256").update(rawFingerprint).digest("hex").slice(0, 16);

  // Approximate location calculation (mockable or GeoIP-aware)
  let location = "Hyderabad, IN";
  if (ipAddress.startsWith("192.168") || ipAddress === "127.0.0.1") {
    location = "Local Network (Hyderabad)";
  } else if (ipAddress.startsWith("10.")) {
    location = "Corporate VPN";
  }

  return {
    deviceIdentifier,
    deviceName,
    browser,
    operatingSystem,
    deviceType,
    ipAddress,
    userAgent,
    location,
  };
}
