import assert from "assert";
import crypto from "crypto";
import bcrypt from "bcryptjs";

console.log("=================================================");
console.log(" 🛡️  TokenGuard Automated Security Test Suite");
console.log("=================================================");

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

  console.log("\n[1] Testing Password Security & Hashing");
  await itAsync("Hashes and verifies passwords using bcrypt", async () => {
    const rawPass = "SuperSecretSecureP@ssw0rd2026";
    const hash = await bcrypt.hash(rawPass, 10);
    assert.strictEqual(await bcrypt.compare(rawPass, hash), true);
    assert.strictEqual(await bcrypt.compare("WrongPassword", hash), false);
  });

  console.log("\n[2] Testing Token Generation & Cryptographic Hashing");
  it("Generates high-entropy refresh tokens and deterministic SHA-256 hashes", () => {
    const token1 = "tg_ref_" + crypto.randomBytes(32).toString("hex");
    const token2 = "tg_ref_" + crypto.randomBytes(32).toString("hex");
    assert.notStrictEqual(token1, token2);

    const hash1 = crypto.createHash("sha256").update(token1).digest("hex");
    const hash2 = crypto.createHash("sha256").update(token1).digest("hex");
    assert.strictEqual(hash1, hash2);
  });

  console.log("\n[3] Testing Risk Scoring Engine");
  it("Calculates low risk for baseline behavior", () => {
    const { calculateRisk } = require("../lib/risk-engine/index.ts");
    const res = calculateRisk({});
    assert.strictEqual(res.score, 0);
    assert.strictEqual(res.level, "LOW");
    assert.strictEqual(res.action, "ALLOW");
  });

  it("Calculates medium risk on new device or IP changes", () => {
    const { calculateRisk } = require("../lib/risk-engine/index.ts");
    const res = calculateRisk({ deviceChanged: true, ipChanged: true });
    assert.strictEqual(res.score, 40);
    assert.strictEqual(res.level, "MEDIUM");
  });

  it("Triggers CRITICAL action on Refresh Token Replay / Theft Detection", () => {
    const { calculateRisk } = require("../lib/risk-engine/index.ts");
    const res = calculateRisk({ tokenReused: true });
    assert.ok(res.score >= 80);
    assert.strictEqual(res.level, "CRITICAL");
    assert.strictEqual(res.action, "REVOKE");
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
