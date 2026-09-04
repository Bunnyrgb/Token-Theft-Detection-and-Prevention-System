"use client";

import React, { useState } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SimulationScenario {
  id: string;
  title: string;
  scenarioKey: string;
  description: string;
  riskImpact: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  icon: any;
  buttonLabel: string;
}

const scenarios: SimulationScenario[] = [
  {
    id: "token-reuse",
    title: "Simulate Token Reuse & Replay Attack",
    scenarioKey: "SIMULATE_TOKEN_REUSE",
    description: "An attacker intercepts an old, already-rotated refresh token and tries to authenticate. The engine detects replay theft and immediately revokes the compromised session tree.",
    riskImpact: "+85 (CRITICAL)",
    severity: "CRITICAL",
    icon: Flame,
    buttonLabel: "Simulate Token Replay Attack",
  },
  {
    id: "new-device",
    title: "Simulate Unrecognized Device Login",
    scenarioKey: "SIMULATE_NEW_DEVICE",
    description: "A session initiates from an unverified browser engine and OS fingerprint not previously paired in the device registry.",
    riskImpact: "+25 (MEDIUM)",
    severity: "MEDIUM",
    icon: Laptop,
    buttonLabel: "Simulate New Device",
  },
  {
    id: "new-ip",
    title: "Simulate Impossible-Travel / Foreign IP",
    scenarioKey: "SIMULATE_NEW_IP",
    description: "Session suddenly reports from an IP address in a distant country (Tokyo, Amsterdam, or Frankfurt) within minutes of a local session.",
    riskImpact: "+35 (HIGH)",
    severity: "HIGH",
    icon: Globe2,
    buttonLabel: "Simulate New IP Anomaly",
  },
  {
    id: "suspicious-burst",
    title: "Simulate Bot / Crawler Scraping Activity",
    scenarioKey: "SIMULATE_SUSPICIOUS_ACTIVITY",
    description: "Altered headless User-Agent and abnormal burst rate detected across authenticated endpoint calls.",
    riskImpact: "+35 (HIGH)",
    severity: "HIGH",
    icon: AlertTriangle,
    buttonLabel: "Simulate Bot Activity",
  },
  {
    id: "concurrent-sessions",
    title: "Simulate Concurrent Multi-Region Sessions",
    scenarioKey: "SIMULATE_CONCURRENT_SESSIONS",
    description: "Simultaneously creates 3 active sessions from London, New York, and Singapore to test concurrent session anomaly thresholds.",
    riskImpact: "+50 (HIGH)",
    severity: "HIGH",
    icon: Radio,
    buttonLabel: "Simulate Concurrent Spikes",
  },
];

export default function SimulatorPage() {
  const router = useRouter();
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [sessionRevoked, setSessionRevoked] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[00:00:00] Threat Simulation Lab Ready. Select an attack or anomaly vector to test real-time defense mechanisms.",
  ]);

  const handleReactivate = async () => {
    try {
      setReactivating(true);
      const res = await fetch("/api/auth/reactivate-current", { method: "POST" });
      const data = await res.json();
      const ts = new Date().toLocaleTimeString();

      if (res.ok) {
        setSessionRevoked(false);
        setLogs((prev) => [
          `[${ts}] RESTORATION: Current session reactivated successfully. You can now execute simulation vectors!`,
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
      const timestamp = new Date().toLocaleTimeString();

      setLogs((prev) => [
        `[${timestamp}] INITIATING ATTACK VECTOR: ${scenario.title}...`,
        ...prev,
      ]);

      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenario.scenarioKey }),
      });

      const data = await res.json();
      const resTimestamp = new Date().toLocaleTimeString();

      if (res.ok) {
        setLogs((prev) => [
          `[${resTimestamp}] SUCCESS: ${data.message}`,
          `[${resTimestamp}] SYSTEM ACTION: Audit event recorded in security_events & active risk score recalculated.`,
          ...prev,
        ]);
      } else {
        if (data.error === "Session revoked" || data.error?.includes("revoked")) {
          setSessionRevoked(true);
          setLogs((prev) => [
            `[${resTimestamp}] NOTICE: Session is revoked by defense policy. Click "Reactivate Session" or sign in again to continue testing.`,
            ...prev,
          ]);
        } else {
          setLogs((prev) => [
            `[${resTimestamp}] ERROR: ${data.error || "Simulation failed"}`,
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
        title="Threat Simulation Lab"
        subtitle="Controlled cybersecurity testing environment to observe real-time detection and automated revocation"
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Session Revoked Notice Banner */}
        {sessionRevoked && (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-3 text-rose-200 text-xs">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Automated Defense Policy Active:</span> Your current session was previously revoked by a token theft/replay attack simulation.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleReactivate}
                isLoading={reactivating}
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950"
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

        {/* Lab Overview Banner */}
        <div className="glass-panel p-5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-purple-950/30 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <FlaskConical className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Safe Simulation Sandboxing</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                Educational SOC Mode
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              These scenarios trigger real multi-factor evaluations in the TokenGuard Risk Engine, generate real audit events in the database, and test automated session revocation without endangering production credentials.
            </p>
          </div>
        </div>

        {/* Live Simulation Terminal Console */}
        <Card className="glass-panel border-cyan-500/30 overflow-hidden">
          <CardHeader className="p-4 bg-[#0a0e1c] border-b border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Live SOC Telemetry Console
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs(["[00:00:00] Console cleared."])}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-400"
              >
                Clear
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4 bg-[#060a16] font-mono text-xs max-h-48 overflow-y-auto space-y-1.5">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`leading-relaxed ${
                  log.includes("SUCCESS") || log.includes("RESTORATION")
                    ? "text-emerald-400"
                    : log.includes("INITIATING")
                    ? "text-cyan-300"
                    : log.includes("NOTICE")
                    ? "text-amber-400"
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

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isRunning = runningScenario === sc.scenarioKey;

            return (
              <Card
                key={sc.id}
                className={`glass-panel-hover flex flex-col justify-between border ${
                  sc.severity === "CRITICAL"
                    ? "border-rose-500/30 hover:border-rose-500/60 bg-gradient-to-br from-rose-950/10 to-slate-900/60"
                    : "border-slate-800 hover:border-cyan-500/40"
                }`}
              >
                <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg border ${
                          sc.severity === "CRITICAL"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">{sc.title}</h3>
                    </div>
                    <Badge variant="risk" riskLevel={sc.severity}>
                      {sc.riskImpact}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 flex-1 space-y-3 text-xs text-slate-300">
                  <p className="leading-relaxed">{sc.description}</p>
                </CardContent>

                <div className="p-5 pt-0">
                  <Button
                    variant={sc.severity === "CRITICAL" ? "destructive" : "primary"}
                    size="sm"
                    onClick={() => handleRunScenario(sc)}
                    isLoading={isRunning}
                    className="w-full text-xs"
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
