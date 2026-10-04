import {
  RiskEvaluationInput,
  RiskEvaluationResult,
  RiskFactor,
  RiskExplanation,
  RiskLevel,
} from "../types";

export interface RiskConfig {
  weightNormalLogin: number;
  weightNewDevice: number;
  weightNewIP: number;
  weightMultipleSuspicious: number;
  weightImpossibleTravel: number;
  weightTokenReuse: number;
  weightRepeatedFailedLogin: number;
  weightAbnormalSession: number;
  thresholdMedium: number;
  thresholdHigh: number;
  thresholdCritical: number;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  weightNormalLogin: 0,
  weightNewDevice: 20,
  weightNewIP: 10,
  weightMultipleSuspicious: 15,
  weightImpossibleTravel: 30,
  weightTokenReuse: 40,
  weightRepeatedFailedLogin: 20,
  weightAbnormalSession: 25,
  thresholdMedium: 25,
  thresholdHigh: 50,
  thresholdCritical: 75,
};

/**
 * Calculates decayed risk score based on hours elapsed since security incidents occurred.
 * Transient anomalies decay with a 24-hour half-life so old events do not permanently penalize users.
 */
export function applyRiskDecay(initialScore: number, hoursElapsed: number): number {
  if (hoursElapsed <= 0) return initialScore;
  if (hoursElapsed >= 168) return 0; // After 7 days, complete decay to baseline

  // Half-life of 24 hours: score * (0.5 ^ (hours / 24))
  const decayed = initialScore * Math.pow(0.5, hoursElapsed / 24);
  return Math.round(decayed);
}

/**
 * Multi-signal dynamic Risk Engine with full factor explainability & automatic remediation policy
 */
export function calculateRisk(
  input: RiskEvaluationInput,
  config: RiskConfig = DEFAULT_RISK_CONFIG
): RiskEvaluationResult {
  let score = 0;
  const factors: RiskFactor[] = [];
  const reasons: string[] = [];

  // 1. Refresh Token Replay / Reuse (Theft indicator)
  if (input.tokenReused) {
    const pts = config.weightTokenReuse;
    score += pts;
    factors.push({
      factor: "Refresh Token Replay Detected",
      score: pts,
      description: "An invalidated or previously rotated token was presented again.",
    });
    reasons.push("Critical: Replay attack detected on invalidated refresh token (+40)");
  }

  // 2. Impossible Travel Velocity
  if (input.impossibleTravel) {
    const pts = config.weightImpossibleTravel;
    score += pts;
    factors.push({
      factor: "Impossible Travel Velocity",
      score: pts,
      description: "Session appeared in a geographically distant region faster than commercial flight speed.",
    });
    reasons.push("Impossible travel velocity exceeded commercial aircraft limit (+30)");
  } else if (input.locationChanged) {
    const pts = 20;
    score += pts;
    factors.push({
      factor: "Geographic Location Shift",
      score: pts,
      description: "Significant geographic displacement detected between session requests.",
    });
    reasons.push("Geographic displacement observed (+20)");
  }

  // 3. New Device Detection
  if (input.deviceChanged) {
    const pts = config.weightNewDevice;
    score += pts;
    factors.push({
      factor: "Unverified Device Fingerprint",
      score: pts,
      description: "Client environment and browser fingerprint does not match known enrolled devices.",
    });
    reasons.push("Unrecognized device fingerprint detected (+20)");
  }

  // 4. IP Address Change
  if (input.ipChanged) {
    const pts = config.weightNewIP;
    score += pts;
    factors.push({
      factor: "IP Address Change",
      score: pts,
      description: "Origin IP address shifted from baseline network during session lifecycle.",
    });
    reasons.push("IP address change observed (+10)");
  }

  // 5. Abnormal Session Behavior (Burst rate, crawler user-agent)
  if (input.unusualActivity || input.suspiciousUserAgent) {
    const pts = config.weightAbnormalSession;
    score += pts;
    factors.push({
      factor: "Abnormal Session Cadence / UA",
      score: pts,
      description: "Navigation rate spikes or headless client traits detected in session stream.",
    });
    reasons.push("Abnormal session navigation cadence or crawler signature (+25)");
  }

  // 6. Concurrent Global Sessions
  if (input.concurrentUsage) {
    const pts = config.weightMultipleSuspicious;
    score += pts;
    factors.push({
      factor: "Multiple Concurrent Sessions",
      score: pts,
      description: "Simultaneous active sessions operating across distinct geographical endpoints.",
    });
    reasons.push("Multiple active concurrent sessions detected (+15)");
  }

  // 7. Repeated Failed Login Attempts
  if (input.failedAttempts && input.failedAttempts > 0) {
    const pts = Math.min(30, input.failedAttempts * 10);
    score += pts;
    factors.push({
      factor: "Repeated Failed Logins",
      score: pts,
      description: `${input.failedAttempts} prior failed password attempts detected from this origin.`,
    });
    reasons.push(`Repeated authentication failures (${input.failedAttempts} attempts, +${pts})`);
  }

  // 8. Custom Factors
  if (input.customFactors) {
    for (const cf of input.customFactors) {
      score += cf.score;
      factors.push(cf);
      reasons.push(`${cf.factor} (+${cf.score})`);
    }
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine Risk Category & Automated Response
  let level: RiskLevel = "LOW";
  let action: "ALLOW" | "MONITOR" | "CHALLENGE" | "REVOKE" = "ALLOW";

  if (score >= config.thresholdCritical) {
    level = "CRITICAL";
    action = "REVOKE";
  } else if (score >= config.thresholdHigh) {
    level = "HIGH";
    action = "CHALLENGE";
  } else if (score >= config.thresholdMedium) {
    level = "MEDIUM";
    action = "MONITOR";
  } else {
    level = "LOW";
    action = "ALLOW";
  }

  // Generate structured, human-readable explainability
  const explanation = generateRiskExplanation(level, factors, action);

  return {
    score,
    level,
    factors,
    reasons,
    action,
    explanation,
  };
}

/**
 * Creates clear, human-comprehensible security explanations answering:
 * 1. What happened?
 * 2. Why is this risky?
 * 3. What action was taken?
 * 4. What should the user do?
 */
function generateRiskExplanation(
  level: RiskLevel,
  factors: RiskFactor[],
  action: "ALLOW" | "MONITOR" | "CHALLENGE" | "REVOKE"
): RiskExplanation {
  if (factors.length === 0 || level === "LOW") {
    return {
      whatHappened: "Standard authenticated request verified with valid cryptographic tokens and recognized device/IP parameters.",
      whyIsThisRisky: "Normal operational baseline; no anomalous signals or indicators of compromise detected.",
      actionTaken: "Session permitted without friction.",
      userRecommendation: "No action necessary. Your session is protected by TokenGuard continuous rotation.",
    };
  }

  const factorNames = factors.map((f) => f.factor).join(", ");

  let whatHappened = `Security telemetry identified ${factors.length} anomaly signal(s): ${factorNames}.`;
  let whyIsThisRisky = "When authentication credentials appear on unfamiliar networks or devices, it indicates possible unauthorized access or token leakage.";
  let actionTaken = "Session placed under heightened telemetry monitoring.";
  let userRecommendation = "Verify that recent activity corresponds to your own devices.";

  if (factors.some((f) => f.factor.includes("Replay"))) {
    whatHappened = "A refresh-token identifier that had already been invalidated in a prior rotation was presented again.";
    whyIsThisRisky = "This is a signature pattern of token theft or credential replay attack, indicating the credential was copied or intercepted.";
    actionTaken = "Compromised session was automatically revoked and tokens invalidated immediately.";
    userRecommendation = "Sign in again immediately with valid credentials and review your active sessions in the dashboard.";
  } else if (factors.some((f) => f.factor.includes("Impossible Travel"))) {
    whatHappened = "Requests for this session originated from two distant geographic locations within an impossible timeframe.";
    whyIsThisRisky = "A human user cannot physically travel between distant continents in minutes; this points to session hijacking or proxy relay abuse.";
    actionTaken = action === "REVOKE" ? "Session automatically terminated." : "Step-up authentication required.";
    userRecommendation = "Review active sessions in your dashboard and revoke any unknown foreign endpoints.";
  } else if (factors.some((f) => f.factor.includes("Unverified Device"))) {
    whatHappened = "Authentication request initiated from an unrecognized browser or operating system.";
    whyIsThisRisky = "Could represent an attacker logging in from a separate device using compromised credentials.";
    actionTaken = "Device added to unverified registry; heightened monitoring enabled.";
    userRecommendation = "If this is your new computer or phone, mark it as trusted in the Devices tab.";
  }

  return {
    whatHappened,
    whyIsThisRisky,
    actionTaken,
    userRecommendation,
  };
}
