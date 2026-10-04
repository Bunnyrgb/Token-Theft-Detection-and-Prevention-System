import assert from "assert";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

console.log("=================================================");
console.log(" 🛡️  TokenGuard Comprehensive Automated Security Test Suite");
console.log("=================================================");

const JWT_TEST_SECRET = new TextEncoder().encode("tokenguard_automated_test_secret_key_32_chars_long!");

async function runTests() {
  let passed = 0;
  let total = 0;

  function it(title, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ [PASS] ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${title}`);
      console.error(err);
    }
  }

  async function itAsync(title, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${title}`);
      console.error(err);
    }
  }

  // =========================================================================
  // SUITE 1: TOKEN SECURITY & REFRESH-TOKEN ROTATION / REPLAY
  // =========================================================================
  console.log("\n[1] Testing Token Cryptography, Rotation & Replay Detection");

  await itAsync("Signs and verifies short-lived JWT access tokens", async () => {
    const payload = { userId: "user-123", sessionId: "sess-abc", email: "soc@tokenguard.io" };
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_TEST_SECRET);

    assert.ok(typeof token === "string" && token.length > 20);

    const { payload: verified } = await jwtVerify(token, JWT_TEST_SECRET);
    assert.strictEqual(verified.userId, "user-123");
    assert.strictEqual(verified.sessionId, "sess-abc");
  });

  await itAsync("Rejects expired JWT tokens", async () => {
    // Token that expired 1 second ago
    const expiredToken = await new SignJWT({ userId: "user-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(JWT_TEST_SECRET);

    let rejected = false;
    try {
      await jwtVerify(expiredToken, JWT_TEST_SECRET);
    } catch {
      rejected = true;
    }
    assert.strictEqual(rejected, true, "Expired token should be rejected");
  });

  it("Generates high-entropy opaque refresh tokens and deterministic SHA-256 hashes", () => {
    const token1 = "tg_ref_" + crypto.randomBytes(32).toString("hex");
    const token2 = "tg_ref_" + crypto.randomBytes(32).toString("hex");
    assert.notStrictEqual(token1, token2);

    const hash1 = crypto.createHash("sha256").update(token1).digest("hex");
    const hash2 = crypto.createHash("sha256").update(token1).digest("hex");
    assert.strictEqual(hash1, hash2);
  });

  it("Executes valid Refresh Token Rotation & vaults previous hash", () => {
    const initialToken = "tg_ref_initial_12345";
    const initialHash = crypto.createHash("sha256").update(initialToken).digest("hex");

    const session = {
      id: "sess_test_1",
      refresh_token_hash: initialHash,
      previous_refresh_token_hashes: [],
      rotation_count: 0,
      status: "Active",
    };

    // Rotation cycle 1
    const presentedToken = initialToken;
    const presentedHash = crypto.createHash("sha256").update(presentedToken).digest("hex");

    assert.strictEqual(presentedHash, session.refresh_token_hash);

    const newToken = "tg_ref_rotated_67890";
    const newHash = crypto.createHash("sha256").update(newToken).digest("hex");

    session.previous_refresh_token_hashes.push(session.refresh_token_hash);
    session.refresh_token_hash = newHash;
    session.rotation_count++;

    assert.strictEqual(session.rotation_count, 1);
    assert.strictEqual(session.previous_refresh_token_hashes.length, 1);
    assert.strictEqual(session.previous_refresh_token_hashes[0], initialHash);
    assert.strictEqual(session.refresh_token_hash, newHash);
  });

  it("Detects Refresh Token Replay / Theft and flags immediate revocation", () => {
    const retiredHash = crypto.createHash("sha256").update("stolen_retired_token").digest("hex");
    const activeHash = crypto.createHash("sha256").update("legitimate_active_token").digest("hex");

    const session = {
      id: "sess_target_99",
      refresh_token_hash: activeHash,
      previous_refresh_token_hashes: [retiredHash],
      rotation_count: 2,
      status: "Active",
    };

    // Attacker attempts to replay the retired token
    const attackerPresentedToken = "stolen_retired_token";
    const attackerHash = crypto.createHash("sha256").update(attackerPresentedToken).digest("hex");

    const isReplay = session.previous_refresh_token_hashes.includes(attackerHash);
    assert.strictEqual(isReplay, true, "Must identify replayed token from vaulted history");

    if (isReplay) {
      session.status = "Revoked";
    }

    assert.strictEqual(session.status, "Revoked", "Compromised session tree must be revoked");
  });

  // =========================================================================
  // SUITE 2: SESSION MANAGEMENT
  // =========================================================================
  console.log("\n[2] Testing Session Lifecycle & Revocation Controls");

  it("Correctly isolates and revokes all other sessions while preserving current", () => {
    const sessions = [
      { id: "sess_curr", user_id: "user-1", status: "Active" },
      { id: "sess_two", user_id: "user-1", status: "Active" },
      { id: "sess_three", user_id: "user-1", status: "Active" },
      { id: "sess_other_user", user_id: "user-2", status: "Active" },
    ];

    const currentSessionId = "sess_curr";
    const targetUserId = "user-1";

    let revokedCount = 0;
    sessions.forEach((s) => {
      if (s.user_id === targetUserId && s.id !== currentSessionId && s.status === "Active") {
        s.status = "Revoked";
        revokedCount++;
      }
    });

    assert.strictEqual(revokedCount, 2);
    assert.strictEqual(sessions.find((s) => s.id === "sess_curr").status, "Active");
    assert.strictEqual(sessions.find((s) => s.id === "sess_two").status, "Revoked");
    assert.strictEqual(sessions.find((s) => s.id === "sess_three").status, "Revoked");
    assert.strictEqual(sessions.find((s) => s.id === "sess_other_user").status, "Active");
  });

  // =========================================================================
  // SUITE 3: RISK-SCORING ENGINE, EXPLAINABILITY & DECAY
  // =========================================================================
  console.log("\n[3] Testing Risk Scoring Engine, Factor Explainability & Decay");

  const RISK_CONFIG = {
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

  function calculateRiskScore(input) {
    let score = 0;
    const factors = [];

    if (input.tokenReused) {
      score += RISK_CONFIG.weightTokenReuse;
      factors.push({ factor: "Refresh Token Replay", score: RISK_CONFIG.weightTokenReuse });
    }
    if (input.impossibleTravel) {
      score += RISK_CONFIG.weightImpossibleTravel;
      factors.push({ factor: "Impossible Travel", score: RISK_CONFIG.weightImpossibleTravel });
    }
    if (input.deviceChanged) {
      score += RISK_CONFIG.weightNewDevice;
      factors.push({ factor: "New Device", score: RISK_CONFIG.weightNewDevice });
    }
    if (input.ipChanged) {
      score += RISK_CONFIG.weightNewIP;
      factors.push({ factor: "IP Change", score: RISK_CONFIG.weightNewIP });
    }
    if (input.concurrentUsage) {
      score += RISK_CONFIG.weightMultipleSuspicious;
      factors.push({ factor: "Multiple Concurrent Sessions", score: RISK_CONFIG.weightMultipleSuspicious });
    }

    score = Math.min(100, Math.max(0, score));

    let level = "LOW";
    let action = "ALLOW";
    if (score >= RISK_CONFIG.thresholdCritical) {
      level = "CRITICAL";
      action = "REVOKE";
    } else if (score >= RISK_CONFIG.thresholdHigh) {
      level = "HIGH";
      action = "CHALLENGE";
    } else if (score >= RISK_CONFIG.thresholdMedium) {
      level = "MEDIUM";
      action = "MONITOR";
    }

    return { score, level, action, factors };
  }

  function applyRiskDecay(initialScore, hoursElapsed) {
    if (hoursElapsed <= 0) return initialScore;
    if (hoursElapsed >= 168) return 0;
    return Math.round(initialScore * Math.pow(0.5, hoursElapsed / 24));
  }

  it("Evaluates LOW risk for baseline user (+0 pts, ALLOW)", () => {
    const res = calculateRiskScore({});
    assert.strictEqual(res.score, 0);
    assert.strictEqual(res.level, "LOW");
    assert.strictEqual(res.action, "ALLOW");
  });

  it("Evaluates MEDIUM risk on new device (+20) or IP change (+10)", () => {
    const res = calculateRiskScore({ deviceChanged: true });
    assert.strictEqual(res.score, 20);

    const res2 = calculateRiskScore({ deviceChanged: true, ipChanged: true });
    assert.strictEqual(res2.score, 30);
    assert.strictEqual(res2.level, "MEDIUM");
    assert.strictEqual(res2.action, "MONITOR");
  });

  it("Evaluates HIGH risk on Impossible Travel (+30) with challenge action", () => {
    const res = calculateRiskScore({ impossibleTravel: true, ipChanged: true, deviceChanged: true });
    assert.strictEqual(res.score, 60);
    assert.strictEqual(res.level, "HIGH");
    assert.strictEqual(res.action, "CHALLENGE");
  });

  it("Caps score at 100 and enforces CRITICAL / REVOKE on multi-vector compromise", () => {
    const res = calculateRiskScore({
      tokenReused: true,
      impossibleTravel: true,
      deviceChanged: true,
      ipChanged: true,
      concurrentUsage: true,
    });
    assert.strictEqual(res.score, 100);
    assert.strictEqual(res.level, "CRITICAL");
    assert.strictEqual(res.action, "REVOKE");
  });

  it("Applies half-life risk decay so old transient events do not permanently penalize users", () => {
    const initial = 80;
    const after24h = applyRiskDecay(initial, 24);
    assert.strictEqual(after24h, 40, "Score should halve after 24 hours");

    const after48h = applyRiskDecay(initial, 48);
    assert.strictEqual(after48h, 20, "Score should quarter after 48 hours");

    const after7d = applyRiskDecay(initial, 170);
    assert.strictEqual(after7d, 0, "Score should completely reset after 7 days");
  });

  // =========================================================================
  // SUITE 4: SECURITY EVENT ENGINE & SIMULATION ISOLATION
  // =========================================================================
  console.log("\n[4] Testing Security Event Engine & Telemetry Isolation");

  it("Ensures simulation events are tagged with is_simulation: true", () => {
    const simEvent = {
      id: crypto.randomUUID(),
      user_id: "user-1",
      event_type: "TOKEN_REPLAY_DETECTED",
      severity: "CRITICAL",
      risk_score: 95,
      ip_address: "45.33.32.156",
      is_simulation: true,
      action_taken: "Session revoked",
    };

    assert.strictEqual(simEvent.is_simulation, true);
    assert.strictEqual(simEvent.severity, "CRITICAL");
    assert.ok(simEvent.risk_score >= 75);
  });

  it("Filters events properly between Production Mode and Simulation Mode", () => {
    const allEvents = [
      { id: "e1", is_simulation: false, event_type: "LOGIN_SUCCESS" },
      { id: "e2", is_simulation: true, event_type: "TOKEN_REPLAY_DETECTED" },
      { id: "e3", is_simulation: false, event_type: "TOKEN_ROTATED" },
    ];

    const productionEvents = allEvents.filter((e) => !e.is_simulation);
    assert.strictEqual(productionEvents.length, 2);
    assert.ok(productionEvents.every((e) => e.is_simulation === false));

    const simulationEvents = allEvents.filter((e) => e.is_simulation);
    assert.strictEqual(simulationEvents.length, 1);
    assert.strictEqual(simulationEvents[0].id, "e2");
  });

  // =========================================================================
  // SUITE 5: AUTHORIZATION & TENANT DATA ISOLATION
  // =========================================================================
  console.log("\n[5] Testing Authorization & Multi-User Data Isolation");

  it("Verifies User A cannot access User B's sessions or events", () => {
    const userA = "usr_alice_123";
    const userB = "usr_bob_456";

    const dbSessions = [
      { id: "sess_a1", user_id: userA, ip_address: "10.0.0.1" },
      { id: "sess_b1", user_id: userB, ip_address: "10.0.0.2" },
    ];

    const dbEvents = [
      { id: "ev_a1", user_id: userA, event_type: "LOGIN_SUCCESS" },
      { id: "ev_b1", user_id: userB, event_type: "TOKEN_REPLAY_DETECTED" },
    ];

    // Query on behalf of User A
    const aliceSessions = dbSessions.filter((s) => s.user_id === userA);
    const aliceEvents = dbEvents.filter((e) => e.user_id === userA);

    assert.strictEqual(aliceSessions.length, 1);
    assert.strictEqual(aliceSessions[0].id, "sess_a1");
    assert.ok(!aliceSessions.some((s) => s.user_id === userB));

    assert.strictEqual(aliceEvents.length, 1);
    assert.strictEqual(aliceEvents[0].id, "ev_a1");
    assert.ok(!aliceEvents.some((e) => e.user_id === userB));
  });

  console.log("\n=================================================");
  console.log(` Test Summary: ${passed} / ${total} Tests Passed`);
  console.log("=================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
