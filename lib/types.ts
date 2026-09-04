export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SessionStatus = "Active" | "Suspicious" | "Revoked" | "Expired";

export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityEventType =
  | "LOGIN"
  | "LOGOUT"
  | "TOKEN_CREATED"
  | "TOKEN_REFRESHED"
  | "TOKEN_REVOKED"
  | "SESSION_CREATED"
  | "SESSION_REVOKED"
  | "NEW_DEVICE"
  | "NEW_IP"
  | "RISK_INCREASED"
  | "SUSPICIOUS_ACTIVITY"
  | "REAUTH_REQUIRED"
  | "TOKEN_REUSE_DETECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_identifier: string;
  device_name: string;
  browser: string;
  operating_system: string;
  device_type: string;
  first_seen_at: string;
  last_seen_at: string;
  trusted: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  session_identifier: string;
  refresh_token_hash: string;
  device_id?: string;
  ip_address: string;
  user_agent: string;
  location: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  revoked_at?: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  status: SessionStatus;
  device?: Device;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  session_id?: string | null;
  event_type: SecurityEventType;
  severity: EventSeverity;
  risk_score: number;
  ip_address: string;
  device_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  event_id?: string | null;
  title: string;
  message: string;
  severity: EventSeverity;
  read: boolean;
  resolved: boolean;
  created_at: string;
}

export interface RiskEvaluationInput {
  ipChanged?: boolean;
  deviceChanged?: boolean;
  locationChanged?: boolean;
  concurrentUsage?: boolean;
  unusualActivity?: boolean;
  suspiciousUserAgent?: boolean;
  tokenReused?: boolean;
  failedAttempts?: number;
  customFactors?: { factor: string; score: number }[];
}

export interface RiskEvaluationResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
  action: "ALLOW" | "CHALLENGE" | "REVOKE";
}

export interface AuthTokenPayload {
  userId: string;
  sessionId: string;
  email: string;
  tokenType: "access" | "refresh";
  iat?: number;
  exp?: number;
}
