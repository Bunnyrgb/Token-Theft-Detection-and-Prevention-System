import { RiskEvaluationInput, RiskEvaluationResult, RiskLevel } from "../types";

export interface RiskConfig {
  weightNewDevice: number;
  weightNewIP: number;
  weightLocationChange: number;
  weightConcurrentUsage: number;
  weightUnusualActivity: number;
  weightSuspiciousUA: number;
  weightTokenReuse: number;
  thresholdMedium: number;
  thresholdHigh: number;
  thresholdCritical: number;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  weightNewDevice: 25,
  weightNewIP: 15,
  weightLocationChange: 20,
  weightConcurrentUsage: 25,
  weightUnusualActivity: 15,
  weightSuspiciousUA: 20,
  weightTokenReuse: 85,
  thresholdMedium: 30,
  thresholdHigh: 60,
  thresholdCritical: 80,
};

/**
 * Multi-signal dynamic Risk Engine
 * Analyzes anomaly vectors and computes precise cybersecurity risk metrics
 */
export function calculateRisk(
  input: RiskEvaluationInput,
  config: RiskConfig = DEFAULT_RISK_CONFIG
): RiskEvaluationResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.tokenReused) {
    score += config.weightTokenReuse;
    reasons.push("Critical: Replay attack detected on invalidated refresh token");
  }

  if (input.deviceChanged) {
    score += config.weightNewDevice;
    reasons.push("New or unverified device fingerprint detected (+25)");
  }

  if (input.ipChanged) {
    score += config.weightNewIP;
    reasons.push("IP address change observed (+15)");
  }

  if (input.locationChanged) {
    score += config.weightLocationChange;
    reasons.push("Significant geographic or impossible-travel displacement (+20)");
  }

  if (input.concurrentUsage) {
    score += config.weightConcurrentUsage;
    reasons.push("Multiple active concurrent sessions accessing simultaneously (+25)");
  }

  if (input.unusualActivity) {
    score += config.weightUnusualActivity;
    reasons.push("Unusual request burst rate or abnormal navigation cadence (+15)");
  }

  if (input.suspiciousUserAgent) {
    score += config.weightSuspiciousUA;
    reasons.push("Suspicious or modified User-Agent header (+20)");
  }

  if (input.failedAttempts && input.failedAttempts > 0) {
    const penalty = Math.min(30, input.failedAttempts * 10);
    score += penalty;
    reasons.push(`Repeated authentication failures (${input.failedAttempts} attempts, +${penalty})`);
  }

  if (input.customFactors) {
    for (const factor of input.customFactors) {
      score += factor.score;
      reasons.push(`${factor.factor} (+${factor.score})`);
    }
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  let level: RiskLevel = "LOW";
  let action: "ALLOW" | "CHALLENGE" | "REVOKE" = "ALLOW";

  if (score >= config.thresholdCritical) {
    level = "CRITICAL";
    action = "REVOKE";
  } else if (score >= config.thresholdHigh) {
    level = "HIGH";
    action = "CHALLENGE";
  } else if (score >= config.thresholdMedium) {
    level = "MEDIUM";
    action = "CHALLENGE";
  } else {
    level = "LOW";
    action = "ALLOW";
  }

  return {
    score,
    level,
    reasons,
    action,
  };
}
