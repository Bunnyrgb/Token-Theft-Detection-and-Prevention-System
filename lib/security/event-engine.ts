import { dbRepository } from "../database";
import { SecurityEvent, SecurityEventType, EventSeverity, Alert } from "../types";

export interface EmitEventInput {
  userId: string;
  sessionId?: string | null;
  eventType: SecurityEventType;
  severity?: EventSeverity;
  riskScore?: number;
  ipAddress: string;
  deviceId?: string | null;
  userAgent?: string;
  location?: string;
  description?: string;
  reason?: string;
  actionTaken?: string;
  isSimulation?: boolean;
  metadata?: Record<string, any>;
}

export interface SecurityEventExplanation {
  whatHappened: string;
  whyIsThisDangerous: string;
  howTokenGuardResponds: string;
  howCanItBePrevented: string;
}

export const eventEngine = {
  /**
   * Emits and persists a standardized security event to the audit trail
   */
  async emit(input: EmitEventInput): Promise<SecurityEvent> {
    const severity = input.severity || determineDefaultSeverity(input.eventType, input.riskScore || 0);
    const riskScore = input.riskScore !== undefined ? input.riskScore : determineDefaultRisk(input.eventType);

    const description = input.description || formatDefaultDescription(input.eventType, input.ipAddress);
    const reason = input.reason || formatDefaultReason(input.eventType);
    const actionTaken = input.actionTaken || formatDefaultAction(severity, input.eventType);

    const event = await dbRepository.createSecurityEvent({
      user_id: input.userId,
      session_id: input.sessionId || null,
      event_type: input.eventType,
      severity,
      risk_score: riskScore,
      ip_address: input.ipAddress,
      device_id: input.deviceId || null,
      user_agent: input.userAgent,
      location: input.location,
      description,
      reason,
      action_taken: actionTaken,
      is_simulation: input.isSimulation || false,
      metadata: input.metadata,
    });

    // Automatically generate SOC Alert for HIGH or CRITICAL severity
    if (severity === "HIGH" || severity === "CRITICAL" || riskScore >= 50) {
      await dbRepository.createAlert({
        user_id: input.userId,
        event_id: event.id,
        title: input.isSimulation
          ? `[SIMULATION] ${formatAlertTitle(input.eventType)}`
          : formatAlertTitle(input.eventType),
        message: `${description} Action taken: ${actionTaken}.`,
        severity,
        is_simulation: input.isSimulation || false,
      });
    }

    return event;
  },

  /**
   * Generates factual, telemetry-grounded security explanations for any event
   */
  explainEvent(event: SecurityEvent): SecurityEventExplanation {
    switch (event.event_type) {
      case "TOKEN_REUSE_DETECTED":
      case "TOKEN_REPLAY_DETECTED":
        return {
          whatHappened:
            "A refresh-token identifier that had already been invalidated in a prior rotation cycle was presented again to the token endpoint.",
          whyIsThisDangerous:
            "This indicates that an adversary may have intercepted, exfiltrated, or cloned a previously issued credential from browser cache, memory, or network transit.",
          howTokenGuardResponds:
            "TokenGuard flags the event as CRITICAL, terminates the entire compromised session tree, and revokes all active and rotated token identifiers.",
          howCanItBePrevented:
            "Enforce strict refresh-token rotation, short access-token lifetimes (15m), HttpOnly cookies, and continuous device/IP velocity monitoring.",
        };

      case "IMPOSSIBLE_TRAVEL":
      case "LOCATION_ANOMALY":
        return {
          whatHappened:
            `Session activity was detected from ${event.location || event.ip_address} within a timeframe that is physically impossible given previous session telemetry.`,
          whyIsThisDangerous:
            "Concurrent or rapidly sequential requests across distant geographies signal distributed credentials or session proxying by malicious actors.",
          howTokenGuardResponds:
            "Elevates risk score (+30) and prompts step-up multi-factor verification or session isolation based on policy.",
          howCanItBePrevented:
            "Monitor velocity thresholds, analyze ASN/proxy headers, and require re-authentication for anomalous geographic shifts.",
        };

      case "NEW_DEVICE":
      case "DEVICE_CHANGED":
        return {
          whatHappened:
            "Authentication occurred from an unrecognized browser environment, operating system, or device fingerprint.",
          whyIsThisDangerous:
            "When valid credentials are used on an unfamiliar device, it could represent legitimate user login or an adversary who obtained the password.",
          howTokenGuardResponds:
            "Registers device as untrusted, increases risk score (+20), and notifies the user via SOC alert.",
          howCanItBePrevented:
            "Employ privacy-preserving device telemetry, require email/SMS confirmation on new device enrollment, and monitor session cookies.",
        };

      case "IP_CHANGED":
      case "NEW_IP":
        return {
          whatHappened:
            `Session IP address shifted to ${event.ip_address}. Telemetry indicates a dynamic IP or network relocation.`,
          whyIsThisDangerous:
            "While frequently benign (e.g. Wi-Fi to cellular transition), sudden IP changes can signify session token exfiltration to an attacker host.",
          howTokenGuardResponds:
            "Updates session audit log, adjusts risk score (+10), and monitors subsequent token rotation velocity.",
          howCanItBePrevented:
            "Correlate IP shifts with device fingerprints and user behavior rather than indiscriminately terminating sessions.",
        };

      case "TOKEN_REFRESHED":
      case "TOKEN_ROTATED":
        return {
          whatHappened:
            "An active refresh token was exchanged for a new access token and rotated refresh token according to OAuth 2.0 Security BCP.",
          whyIsThisDangerous:
            "Normal cryptographic maintenance. However, rapid rotation bursts can indicate token harvesting.",
          howTokenGuardResponds:
            "Stores cryptographic SHA-256 hash of previous token in the session's replay tracking history and issues new short-lived credentials.",
          howCanItBePrevented:
            "Regular rotation ensures stolen refresh tokens can only be used once before triggering automatic replay detection.",
        };

      case "SESSION_REVOKED":
        return {
          whatHappened:
            "A session was explicitly terminated by either user command or automated security policy enforcement.",
          whyIsThisDangerous:
            "Ensures compromised or suspicious authorization streams cannot be reused to access protected resources.",
          howTokenGuardResponds:
            "Marks session status as 'Revoked', records revoked timestamp, and rejects subsequent token refresh requests.",
          howCanItBePrevented:
            "Allows users and security administrators to proactively isolate suspected security breaches.",
        };

      case "TOKEN_REVOKED_ATTEMPT":
        return {
          whatHappened:
            "An inbound request attempted to authenticate using credentials tied to a session that had already been explicitly revoked.",
          whyIsThisDangerous:
            "Signals that an attacker or stale background script is attempting to utilize retired credentials from a terminated session.",
          howTokenGuardResponds:
            "Rejects the request with HTTP 401 Unauthorized and flags the origin IP for suspicious credential reuse (+55).",
          howCanItBePrevented:
            "Immediately invalidate local client storage and clear cookies upon logout or administrative revocation.",
        };

      case "TOKEN_EXPIRED":
        return {
          whatHappened:
            "A client presented an access or refresh token whose cryptographic expiration time had passed.",
          whyIsThisDangerous:
            "Can indicate client clock synchronization issues or an attacker attempting to replay stale captured session tokens.",
          howTokenGuardResponds:
            "Rejects the expired token, issues an informational security event, and prompts the user for re-authentication.",
          howCanItBePrevented:
            "Utilize short-lived access tokens (15m) combined with automated silent refresh rotation before token expiry.",
        };

      case "MULTIPLE_SESSIONS":
        return {
          whatHappened:
            "Multiple concurrent active sessions were detected operating from disparate geographic or device endpoints simultaneously.",
          whyIsThisDangerous:
            "Concurrent multi-region usage frequently indicates credential leakage, shared accounts, or distributed proxy attacks.",
          howTokenGuardResponds:
            "Aggregates session risk, creates a SOC monitoring alert, and provides one-click bulk revocation for operators.",
          howCanItBePrevented:
            "Enforce concurrent session limits or require multi-factor verification when creating additional concurrent sessions.",
        };

      default:
        return {
          whatHappened: `Security event [${event.event_type}] logged with severity [${event.severity}].`,
          whyIsThisDangerous:
            "System telemetry monitoring authentication actions to maintain zero-trust session integrity.",
          howTokenGuardResponds:
            "Records immutable audit entry and recalculates composite session risk score.",
          howCanItBePrevented:
            "Maintain strong credentials and follow security recommendations provided in the console.",
        };
    }
  },
};

function determineDefaultSeverity(type: SecurityEventType, score: number): EventSeverity {
  if (type === "TOKEN_REPLAY_DETECTED" || type === "TOKEN_REUSE_DETECTED") return "CRITICAL";
  if (type === "TOKEN_REVOKED_ATTEMPT") return "HIGH";
  if (type === "IMPOSSIBLE_TRAVEL" || type === "MULTIPLE_SESSIONS") return "HIGH";
  if (type === "NEW_DEVICE" || type === "DEVICE_CHANGED") return "MEDIUM";
  if (type === "TOKEN_EXPIRED") return "MEDIUM";
  if (type === "IP_CHANGED" || type === "NEW_IP") return "LOW";
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "INFO";
}

function determineDefaultRisk(type: SecurityEventType): number {
  switch (type) {
    case "TOKEN_REPLAY_DETECTED":
    case "TOKEN_REUSE_DETECTED":
      return 40;
    case "TOKEN_REVOKED_ATTEMPT":
      return 55;
    case "IMPOSSIBLE_TRAVEL":
      return 30;
    case "TOKEN_EXPIRED":
      return 35;
    case "NEW_DEVICE":
    case "DEVICE_CHANGED":
      return 20;
    case "IP_CHANGED":
    case "NEW_IP":
      return 10;
    case "MULTIPLE_SESSIONS":
      return 15;
    case "SUSPICIOUS_ACTIVITY":
      return 25;
    default:
      return 0;
  }
}

function formatDefaultDescription(type: SecurityEventType, ip: string): string {
  switch (type) {
    case "LOGIN_SUCCESS":
    case "LOGIN":
      return `User authenticated successfully from ${ip}.`;
    case "LOGIN_FAILED":
      return `Failed authentication attempt from IP ${ip}.`;
    case "TOKEN_ISSUED":
    case "TOKEN_CREATED":
      return "New cryptographic access token and refresh token family issued.";
    case "TOKEN_REFRESHED":
    case "TOKEN_ROTATED":
      return "Refresh token rotated and new short-lived access token generated.";
    case "TOKEN_REPLAY_DETECTED":
    case "TOKEN_REUSE_DETECTED":
      return `CRITICAL: Inbound request presented previously invalidated refresh token from IP ${ip}.`;
    case "TOKEN_REVOKED_ATTEMPT":
      return `HIGH RISK: Authentication attempted with credentials from an explicitly revoked session from ${ip}.`;
    case "TOKEN_EXPIRED":
      return `Client presented expired cryptographic token from IP ${ip}.`;
    case "MULTIPLE_SESSIONS":
      return `Suspicious concurrent active sessions detected across distinct endpoints from ${ip}.`;
    case "NEW_DEVICE":
    case "DEVICE_CHANGED":
      return `Unverified client device fingerprint detected from ${ip}.`;
    case "NEW_IP":
    case "IP_CHANGED":
      return `Session transitioned to new IP address ${ip}.`;
    case "IMPOSSIBLE_TRAVEL":
    case "LOCATION_ANOMALY":
      return `Impossible travel anomaly detected from IP ${ip}.`;
    case "SESSION_REVOKED":
      return "Session revoked and authorization invalidated.";
    case "SESSION_EXPIRED":
      return "Session expired after token validity window elapsed.";
    default:
      return `Security event ${type} recorded.`;
  }
}

function formatDefaultReason(type: SecurityEventType): string {
  switch (type) {
    case "TOKEN_REPLAY_DETECTED":
    case "TOKEN_REUSE_DETECTED":
      return "A previously rotated refresh-token identifier was presented again.";
    case "TOKEN_REVOKED_ATTEMPT":
      return "An explicit authentication attempt was made using credentials from a session marked Revoked.";
    case "TOKEN_EXPIRED":
      return "The cryptographic expiration timestamp of the provided token has passed.";
    case "MULTIPLE_SESSIONS":
      return "Multiple simultaneous active sessions detected from non-correlated IP addresses or regions.";
    case "IMPOSSIBLE_TRAVEL":
      return "Geographic displacement speed exceeds maximum plausible physical travel velocity.";
    case "NEW_DEVICE":
    case "DEVICE_CHANGED":
      return "Client user-agent and device telemetry not found in user's trusted device registry.";
    case "IP_CHANGED":
      return "Client network address shifted during active session lifetime.";
    default:
      return "Standard security evaluation based on client telemetry signals.";
  }
}

function formatDefaultAction(severity: EventSeverity, type: SecurityEventType): string {
  if (severity === "CRITICAL" || type === "TOKEN_REPLAY_DETECTED" || type === "TOKEN_REUSE_DETECTED") {
    return "Session automatically revoked; tokens invalidated immediately.";
  }
  if (type === "TOKEN_REVOKED_ATTEMPT") {
    return "Request rejected (401 Unauthorized); incident logged to SOC alert feed.";
  }
  if (severity === "HIGH") {
    return "Flagged for monitoring; step-up verification required.";
  }
  if (severity === "MEDIUM") {
    return "Monitored; device added to unverified registry.";
  }
  return "Allowed; telemetry logged to audit trail.";
}

function formatAlertTitle(type: SecurityEventType): string {
  switch (type) {
    case "TOKEN_REPLAY_DETECTED":
    case "TOKEN_REUSE_DETECTED":
      return "CRITICAL: Token Theft & Replay Attack Neutralized";
    case "TOKEN_REVOKED_ATTEMPT":
      return "HIGH: Authentication Attempt with Revoked Credentials";
    case "TOKEN_EXPIRED":
      return "NOTICE: Expired Token Re-authentication Required";
    case "MULTIPLE_SESSIONS":
      return "HIGH: Anomalous Concurrent Sessions Detected";
    case "IMPOSSIBLE_TRAVEL":
      return "HIGH: Impossible Travel Anomaly Detected";
    case "NEW_DEVICE":
    case "DEVICE_CHANGED":
      return "Notice: New Device Connected";
    case "SUSPICIOUS_ACTIVITY":
      return "HIGH: Suspicious Navigation Cadence Flagged";
    default:
      return `Security Alert: ${type.replace(/_/g, " ")}`;
  }
}
