export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SessionStatus = "Active" | "Suspicious" | "Revoked" | "Expired";

export type EventSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityEventType =
  | "LOGIN"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "TOKEN_CREATED"
  | "TOKEN_ISSUED"
  | "TOKEN_REFRESHED"
  | "TOKEN_ROTATED"
  | "TOKEN_REVOKED"
  | "TOKEN_EXPIRED"
  | "TOKEN_REVOKED_ATTEMPT"
  | "TOKEN_REUSE_DETECTED"
  | "TOKEN_REPLAY_DETECTED"
  | "SESSION_CREATED"
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "NEW_DEVICE"
  | "DEVICE_CHANGED"
  | "NEW_IP"
  | "IP_CHANGED"
  | "LOCATION_ANOMALY"
  | "IMPOSSIBLE_TRAVEL"
  | "MULTIPLE_SESSIONS"
  | "RISK_INCREASED"
  | "RISK_SCORE_CHANGED"
  | "SUSPICIOUS_ACTIVITY"
  | "REAUTH_REQUIRED";

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
  previous_refresh_token_hashes?: string[]; // Token family history for replay detection
  rotation_count?: number;
  last_rotated_at?: string;
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
  is_current?: boolean;
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
  user_agent?: string;
  location?: string;
  description?: string;
  reason?: string;
  action_taken?: string;
  is_simulation?: boolean;
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
  is_simulation?: boolean;
}

export interface RiskFactor {
  factor: string;
  score: number;
  description?: string;
}

export interface RiskEvaluationInput {
  ipChanged?: boolean;
  deviceChanged?: boolean;
  locationChanged?: boolean;
  impossibleTravel?: boolean;
  concurrentUsage?: boolean;
  unusualActivity?: boolean;
  suspiciousUserAgent?: boolean;
  tokenReused?: boolean;
  tokenExpired?: boolean;
  tokenRevoked?: boolean;
  failedAttempts?: number;
  customFactors?: RiskFactor[];
}

export interface RiskExplanation {
  whatHappened: string;
  whyIsThisRisky: string;
  actionTaken: string;
  userRecommendation: string;
}

export interface RiskEvaluationResult {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  reasons: string[];
  action: "ALLOW" | "MONITOR" | "CHALLENGE" | "REVOKE";
  explanation: RiskExplanation;
}

export interface AuthTokenPayload {
  userId: string;
  sessionId: string;
  email: string;
  tokenType: "access" | "refresh";
  iat?: number;
  exp?: number;
}

