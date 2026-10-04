"use client";

import React, { useState } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Laptop,
  Globe2,
  Flame,
  AlertTriangle,
  Radio,
  RefreshCw,
  Terminal,
  Zap,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  LogIn,
  KeyRound,
  Lock,
  ChevronRight,
  Layers,
  ExternalLink,
  Ban,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SimulationScenario {
  id: string;
  title: string;
  scenarioKey: string;
  category: string;
  description: string;
  riskImpact: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  icon: any;
  buttonLabel: string;
  expectedAction: string;
}

const scenarios: SimulationScenario[] = [
  {
    id: "token-replay",
    title: "1. Refresh Token Replay & Theft Attack",
    scenarioKey: "SIMULATE_TOKEN_REPLAY",
    category: "Critical Exploit",
    description: "An attacker intercepts an already-rotated refresh token and attempts replay. The detection engine identifies the retired hash in the session family vault, calculates a CRITICAL risk score (95), and revokes the session immediately.",
    riskImpact: "Score: 95 (CRITICAL)",
    severity: "CRITICAL",
    icon: Flame,
    buttonLabel: "Simulate Token Replay Attack",
    expectedAction: "REVOKE: Compromised session terminated & alert issued",
  },
  {
    id: "revoked-token",
    title: "2. Revoked Token Re-Use Attempt",
    scenarioKey: "SIMULATE_REVOKED_TOKEN",
    category: "Authorization Breach",
    description: "An inbound request attempts to authenticate with credentials tied to a session that was already explicitly revoked. Detected as unauthorized credential reuse.",
    riskImpact: "Score: 65 (HIGH)",
    severity: "HIGH",
    icon: Ban,
    buttonLabel: "Simulate Revoked Token",
    expectedAction: "CHALLENGE: Request rejected (401); alert dispatched",
  },
  {
    id: "impossible-travel",
    title: "3. Impossible Travel Velocity",
    scenarioKey: "SIMULATE_IMPOSSIBLE_TRAVEL",
    category: "Geographic Velocity",
    description: "Session shifts across continents (Hyderabad to London) in 20 minutes. Velocity calculation indicates impossible flight speed (>800 km/h) triggering geographic anomaly defense.",
    riskImpact: "Score: 60 (HIGH)",
    severity: "HIGH",
    icon: Globe2,
    buttonLabel: "Simulate Impossible Travel",
    expectedAction: "CHALLENGE: Step-up re-authentication required",
  },
  {
    id: "multiple-sessions",
    title: "4. Suspicious Multiple Sessions",
    scenarioKey: "SIMULATE_MULTIPLE_SESSIONS",
    category: "Concurrent Anomaly",
    description: "Simultaneous active sessions operating across non-correlated geographical endpoints (e.g. Amsterdam & Hyderabad). Flags potential credential leakage or proxy distribution.",
    riskImpact: "Score: 55 (HIGH)",
    severity: "HIGH",
    icon: Layers,
    buttonLabel: "Simulate Concurrent Sessions",
    expectedAction: "CHALLENGE: Active sessions flagged & monitored",
  },
  {
    id: "failed-logins",
    title: "5. Multiple Failed Login Attempts",
    scenarioKey: "SIMULATE_FAILED_LOGINS",
    category: "Credential Stuffing",
    description: "Simulates 5 rapid consecutive failed password attempts from a malicious automated script to trigger credential stuffing and brute-force defenses.",
    riskImpact: "Score: 50 (HIGH)",
    severity: "HIGH",
    icon: AlertTriangle,
    buttonLabel: "Simulate Failed Logins",
    expectedAction: "CHALLENGE: Origin IP throttled & flagged",
  },
  {
    id: "expired-token",
    title: "6. Expired Token Presentation",
    scenarioKey: "SIMULATE_EXPIRED_TOKEN",
    category: "Token Cryptography",
    description: "Presents a cryptographically expired JWT/refresh token whose expiration claim has passed. Validates token rejection and silent refresh enforcement.",
    riskImpact: "Score: 35 (MEDIUM)",
    severity: "MEDIUM",
    icon: Clock,
    buttonLabel: "Simulate Expired Token",
    expectedAction: "MONITOR: Token rejected; re-authentication required",
  },
  {
    id: "new-device",
    title: "7. Unrecognized Device Login",
    scenarioKey: "SIMULATE_NEW_DEVICE",
    category: "Device Anomaly",
    description: "A login initiates from an unverified browser engine and OS fingerprint not previously paired to the user's account.",
    riskImpact: "Score: 30 (MEDIUM)",
    severity: "MEDIUM",
    icon: Laptop,
    buttonLabel: "Simulate New Device",
    expectedAction: "MONITOR: Device marked unverified; alert generated",
  },
  {
    id: "normal-login",
    title: "8. Normal Authenticated Login",
    scenarioKey: "SIMULATE_NORMAL_LOGIN",
    category: "Baseline",
    description: "Authenticates from a verified device and familiar network IP. Establishes the expected baseline with zero risk addition.",
    riskImpact: "Score: 0 (LOW)",
    severity: "INFO",
    icon: CheckCircle2,
    buttonLabel: "Simulate Normal Login",
    expectedAction: "ALLOW: Session permitted without challenge",
  },
  {
    id: "token-rotation",
    title: "9. Legitimate Token Rotation (RFC 6749)",
    scenarioKey: "SIMULATE_TOKEN_ROTATION",
    category: "OAuth 2.0 BCP",
    description: "Executes a legitimate refresh token rotation cycle. Issues new credentials and vaults the retired token hash into the replay detection cache.",
    riskImpact: "Score: 0 (INFO)",
    severity: "INFO",
    icon: RefreshCw,
    buttonLabel: "Simulate Legitimate Rotation",
    expectedAction: "ALLOW: Old token retired; new tokens issued",
  },
];

export default function SimulatorPage() {
  const router = useRouter();
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [sessionRevoked, setSessionRevoked] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [currentStages, setCurrentStages] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);

  const [logs, setLogs] = useState<string[]>([
    "[00:00:00] Threat Simulation Lab Initialized. Choose an attack vector to observe detection → risk calculation → security decision → audit pipeline.",
  ]);

  const handleReactivate = async () => {
    try {
      setReactivating(true);
      const res = await fetch("/api/auth/reactivate-current", { method: "POST" });
      const ts = new Date().toLocaleTimeString();

      if (res.ok) {
        setSessionRevoked(false);
        setLogs((prev) => [
          `[${ts}] RESTORATION: Current session reactivated successfully. You can now execute further simulation vectors!`,
          ...prev,
        ]);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setReactivating(false);
    }
  };

  const handleRunScenario = async (scenario: SimulationScenario) => {
    try {
      setRunningScenario(scenario.scenarioKey);
      setLastResult(null);
      const ts = new Date().toLocaleTimeString();

      setCurrentStages([
        "1. Simulation Triggered: Initiating test scenario [DEMO/SIMULATION]...",
        "2. Event Generation: Generating simulated telemetry & masked token identifier...",
      ]);

      setLogs((prev) => [
        `[${ts}] INITIATING ATTACK VECTOR: ${scenario.title} [DEMO/SIMULATION]...`,
        ...prev,
      ]);

      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenario.scenarioKey }),
      });

      const data = await res.json();
      const resTs = new Date().toLocaleTimeString();

      if (res.ok) {
        setLastResult(data);
        if (data.stages) {
          setCurrentStages(data.stages);
        }
        setLogs((prev) => [
          `[${resTs}] SUCCESS: ${data.message}`,
          `[${resTs}] SECURITY POLICY APPLIED: Action [${data.action || data.securityAction}]. Event stored with is_simulation=true.`,
          ...prev,
        ]);
      } else {
        if (data.error === "Session revoked" || data.error?.includes("revoked")) {
          setSessionRevoked(true);
          setLogs((prev) => [
            `[${resTs}] DEFENSE ALERT: Session revoked by security policy. Click "Reactivate Session" or sign in again to continue testing.`,
            ...prev,
          ]);
        } else {
          setLogs((prev) => [
            `[${resTs}] ERROR: ${data.error || "Simulation failed"}`,
            ...prev,
          ]);
        }
      }
    } catch (e: any) {
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] NETWORK ERROR: ${e.message}`,
        ...prev,
      ]);
    } finally {
      setRunningScenario(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Security Test & Threat Simulation Lab"
        subtitle="Safely simulate token replay attacks, impossible travel, and rogue devices in real-time"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* MANDATORY SIMULATION DISCLAIMER BANNER (Requirement 15) */}
        <div className="p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <FlaskConical className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span>SIMULATION MODE — NO REAL ATTACK IS BEING PERFORMED</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                All events generated in this lab are tagged with <code className="text-cyan-300 font-bold bg-cyan-950 px-1 rounded">is_simulation: true</code>. Real user tokens and credentials remain completely untouched.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/alerts">
              <Button size="sm" variant="secondary" className="whitespace-nowrap text-xs">
                View Alerts
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="cyber" className="whitespace-nowrap text-xs">
                View Dashboard
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Session Revoked Notice Banner */}
        {sessionRevoked && (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-3 text-rose-200 text-xs">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Automated Defense Policy Active:</span> A simulated token theft / replay attack triggered session revocation.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleReactivate}
                isLoading={reactivating}
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reactivate Session
              </Button>
              <Link href="/login">
                <Button variant="secondary" size="sm" className="text-xs">
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Sign In Again
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Real-Time Detection & Automated Response Pipeline (Stages 1-6) */}
        <Card className="glass-panel border-cyan-500/30 overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              Real-Time Detection & Automated Response Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">STAGE 1</div>
                <div className="font-semibold text-white">Simulation Started</div>
                <div className="text-[10px] text-slate-400">Operator selects attack vector</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">STAGE 2</div>
                <div className="font-semibold text-white">Event Generated</div>
                <div className="text-[10px] text-slate-400">Inbound HTTP telemetry payload</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">STAGE 3</div>
                <div className="font-semibold text-white">Detection Engine</div>
                <div className="text-[10px] text-slate-400">Token vault & velocity analysis</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">STAGE 4</div>
                <div className="font-semibold text-white">Risk Calculation</div>
                <div className="text-[10px] text-slate-400">0–100 score + factor breakdown</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">STAGE 5</div>
                <div className="font-semibold text-white">Security Decision</div>
                <div className="text-[10px] text-slate-400">ALLOW | MONITOR | REVOKE</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 font-bold">STAGE 6</div>
                <div className="font-semibold text-white">Dashboard Event</div>
                <div className="text-[10px] text-slate-400">Committed to audit stream</div>
              </div>
            </div>

            {/* Live Pipeline Execution Steps */}
            {currentStages.length > 0 && (
              <div className="p-3.5 rounded-lg bg-[#060a16] border border-cyan-500/30 font-mono text-xs space-y-1.5 text-cyan-300">
                <div className="text-slate-400 font-bold uppercase text-[10px] flex items-center justify-between">
                  <span>Execution Pipeline Diagnostics:</span>
                  <span className="text-cyan-400">[SIMULATION ACTIVE]</span>
                </div>
                {currentStages.map((stg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{stg}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Simulation Result & Risk Factor Inspection Panel */}
        {lastResult && (
          <Card className="glass-panel border-cyan-500/40 bg-gradient-to-br from-slate-950/90 to-slate-900/90 shadow-[0_0_25px_rgba(0,240,255,0.1)]">
            <CardHeader className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <span>Simulation Telemetry Output</span>
                    <Badge variant="risk" riskLevel={lastResult.riskLevel || "LOW"}>
                      Risk Score: {lastResult.riskScore} / 100 [{lastResult.riskLevel}]
                    </Badge>
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Scenario: <span className="text-cyan-300">{lastResult.scenario}</span> | Status: <span className="text-emerald-400 font-bold">COMPLETED [SIMULATION]</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/dashboard/alerts">
                  <Button size="sm" variant="secondary" className="text-xs">
                    View in Alerts
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="sm" variant="cyber" className="text-xs">
                    View Dashboard
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Summary message */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-mono">
                {lastResult.message}
              </div>

              {/* Key Indicators Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {lastResult.simulatedTokenIdentifier && (
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Simulated Token Identifier</div>
                    <div className="font-mono text-xs text-amber-400 font-bold truncate">
                      {lastResult.simulatedTokenIdentifier}
                    </div>
                    <div className="text-[10px] text-slate-500">Masked (No raw secrets exposed)</div>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Security Decision</div>
                  <div className={`font-mono text-xs font-bold ${
                    (lastResult.securityAction || lastResult.action) === "REVOKE"
                      ? "text-rose-400"
                      : (lastResult.securityAction || lastResult.action) === "CHALLENGE"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}>
                    {lastResult.securityAction || lastResult.action || "ALLOW"}
                  </div>
                  <div className="text-[10px] text-slate-500">Enforced by Security Engine</div>
                </div>

                {lastResult.revokedSessionIdentifier && (
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-rose-500/30 space-y-1">
                    <div className="text-[10px] text-rose-400 uppercase font-mono">Revoked Session</div>
                    <div className="font-mono text-xs text-rose-300 font-bold truncate">
                      {lastResult.revokedSessionIdentifier}
                    </div>
                    <div className="text-[10px] text-rose-400/80">Terminated across endpoints</div>
                  </div>
                )}
              </div>

              {/* Individual Risk Factors Table */}
              {lastResult.riskFactors && lastResult.riskFactors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Calculated Risk Factor Breakdown:</span>
                  </div>
                  <div className="rounded-lg border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Risk Factor</th>
                          <th className="p-2.5">Impact</th>
                          <th className="p-2.5">Telemetry Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {lastResult.riskFactors.map((rf: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="p-2.5 font-semibold text-white font-mono">{rf.factor}</td>
                            <td className="p-2.5 font-bold font-mono text-amber-400">+{rf.score}</td>
                            <td className="p-2.5 text-slate-400 text-[11px]">{rf.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Live Simulation Terminal Console Stream */}
        <Card className="glass-panel border-cyan-500/30 overflow-hidden">
          <CardHeader className="p-4 bg-[#0a0e1c] border-b border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-slate-300">
                SOC Threat Simulation Console Stream
              </CardTitle>
            </div>
            <button
              onClick={() => setLogs(["[00:00:00] Console cleared."])}
              className="text-[11px] font-mono text-slate-400 hover:text-cyan-400"
            >
              Clear Console
            </button>
          </CardHeader>
          <CardContent className="p-4 bg-[#060a16] font-mono text-xs max-h-44 overflow-y-auto space-y-1.5">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`leading-relaxed ${
                  log.includes("SUCCESS") || log.includes("RESTORATION")
                    ? "text-emerald-400"
                    : log.includes("INITIATING")
                    ? "text-cyan-300"
                    : log.includes("ALERT")
                    ? "text-rose-400 font-bold"
                    : log.includes("ERROR")
                    ? "text-rose-400"
                    : "text-slate-400"
                }`}
              >
                {log}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 9 Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isRunning = runningScenario === sc.scenarioKey;

            return (
              <Card
                key={sc.id}
                className={`glass-panel-hover flex flex-col justify-between border ${
                  sc.severity === "CRITICAL"
                    ? "border-rose-500/40 hover:border-rose-500/70 bg-gradient-to-br from-rose-950/20 to-slate-900/80"
                    : sc.severity === "HIGH"
                    ? "border-amber-500/30 hover:border-amber-500/60"
                    : "border-slate-800 hover:border-cyan-500/40"
                }`}
              >
                <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg border ${
                          sc.severity === "CRITICAL"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : sc.severity === "HIGH"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-mono leading-tight">{sc.title}</h3>
                        <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">{sc.category}</div>
                      </div>
                    </div>
                    <Badge variant="risk" riskLevel={sc.severity}>
                      {sc.riskImpact}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 flex-1 space-y-3 text-xs text-slate-300">
                  <p className="leading-relaxed">{sc.description}</p>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
                    <span className="text-slate-500">Security Decision: </span>
                    <span className="text-slate-200">{sc.expectedAction}</span>
                  </div>
                </CardContent>

                <div className="p-5 pt-0">
                  <Button
                    variant={sc.severity === "CRITICAL" ? "destructive" : "cyber"}
                    size="sm"
                    onClick={() => handleRunScenario(sc)}
                    isLoading={isRunning}
                    className="w-full text-xs font-mono"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    {sc.buttonLabel}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
