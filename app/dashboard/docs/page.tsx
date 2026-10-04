"use client";

import React from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  KeyRound,
  RefreshCw,
  Cpu,
  Radio,
  Lock,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  HelpCircle,
} from "lucide-react";

export default function DocumentationPage() {
  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Security & Technical Documentation"
        subtitle="Architecture, Threat Models, Risk Mechanics, and Operational Limitations"
      />

      <main className="p-6 space-y-6 max-w-5xl w-full mx-auto">
        {/* Important Disclaimer Banner */}
        <div className="glass-panel p-5 rounded-xl border border-amber-500/40 bg-amber-950/20 flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wide font-mono">
              Operational Scope & Demonstration Disclaimer
            </h3>
            <p className="text-xs text-amber-200/90 leading-relaxed font-normal">
              <strong>TokenGuard</strong> is a security monitoring, threat detection, and demonstration platform. Detection results are calculated based on configured client telemetry and anomaly signals, and should not be treated as guaranteed legal or cryptographic proof of host compromise. Simulated attack events in the Threat Lab are sandboxed demonstrations and do not attack real network endpoints.
            </p>
          </div>
        </div>

        {/* Section 1: What is Token Theft? */}
        <Card className="glass-panel border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-cyan-400" />
              1. What is Token Theft?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs text-slate-300 space-y-3 leading-relaxed">
            <p>
              In modern web architectures, authentication is primarily handled using JSON Web Tokens (JWT) and bearer session credentials. Token theft occurs when an adversary intercepts, copies, or exfiltrates valid authentication tokens without knowing the user’s primary password.
            </p>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-semibold text-white">Common Exfiltration Vectors:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong>Cross-Site Scripting (XSS):</strong> Malicious scripts reading tokens stored in `localStorage` or `sessionStorage`.</li>
                <li><strong>Infostealer Malware:</strong> Local trojans extracting browser SQLite cookie jars and application caches from compromised endpoints.</li>
                <li><strong>Adversary-in-the-Middle (AiTM):</strong> Reverse-proxy phishing capturing active session tokens during authentication handshakes.</li>
                <li><strong>Network Eavesdropping / Proxy Interception:</strong> Tokens exposed across unencrypted or improperly TLS-inspected proxy paths.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: What is Token Replay & Refresh-Token Rotation? */}
        <Card className="glass-panel border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              2. What is Token Replay & How Does Refresh-Token Rotation Work?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs text-slate-300 space-y-3 leading-relaxed">
            <p>
              <strong>Token Replay</strong> occurs when an attacker steals a token and replays it to the authentication server to masquerade as the authentic user. To mitigate this without forcing users to re-login every 15 minutes, TokenGuard implements <strong>strict Refresh Token Rotation (RTR)</strong> adhering to the OAuth 2.0 Security Best Current Practice (BCP).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="font-bold text-cyan-300">Legitimate Rotation Flow</div>
                <p className="text-slate-400 text-[11px]">
                  1. Client presents Refresh Token `R1`.<br />
                  2. Server validates `R1` and issues new Access Token `A2` + new Refresh Token `R2`.<br />
                  3. `R1` is retired and its SHA-256 hash is vaulted in the session’s previous token history.<br />
                  4. The legitimate client stores `R2` for subsequent use.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-rose-500/30 space-y-1.5">
                <div className="font-bold text-rose-300">Replay Attack Detection</div>
                <p className="text-slate-400 text-[11px]">
                  1. An attacker later presents stolen token `R1`.<br />
                  2. TokenGuard checks the session history: `R1` was already rotated!<br />
                  3. The engine flags **TOKEN_REPLAY_DETECTED** (+40 / CRITICAL risk).<br />
                  4. The entire compromised session tree is **immediately revoked**!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Risk-Scoring Engine */}
        <Card className="glass-panel border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              3. How Does the Multi-Signal Risk Engine Work?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs text-slate-300 space-y-3 leading-relaxed">
            <p>
              Rather than making binary pass/fail decisions on individual weak signals, TokenGuard employs a composite multi-signal risk engine that computes an index from <strong>0 to 100</strong>:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Security Vector / Signal</th>
                    <th className="pb-2">Risk Contribution</th>
                    <th className="pb-2">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300 font-sans">
                  <tr>
                    <td className="py-2 font-medium text-white">Normal Login</td>
                    <td className="py-2 font-mono text-emerald-400">+0 pts</td>
                    <td className="py-2 text-slate-400">Baseline authentic request on enrolled device</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-white">IP Address Change</td>
                    <td className="py-2 font-mono text-cyan-400">+10 pts</td>
                    <td className="py-2 text-slate-400">Normal network relocation or cellular ISP dynamic jump</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-white">Multiple Active Sessions</td>
                    <td className="py-2 font-mono text-blue-400">+15 pts</td>
                    <td className="py-2 text-slate-400">Concurrent active streams across endpoints</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-white">Unverified / New Device</td>
                    <td className="py-2 font-mono text-amber-400">+20 pts</td>
                    <td className="py-2 text-slate-400">Browser fingerprint not previously paired to user</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-white">Repeated Failed Logins</td>
                    <td className="py-2 font-mono text-amber-400">+20 pts</td>
                    <td className="py-2 text-slate-400">Brute-force or dictionary stuffing attempts</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-white">Abnormal Session / Bot Signature</td>
                    <td className="py-2 font-mono text-purple-400">+25 pts</td>
                    <td className="py-2 text-slate-400">Headless browser or rapid automated request bursts</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-white">Impossible Travel Velocity</td>
                    <td className="py-2 font-mono text-rose-400">+30 pts</td>
                    <td className="py-2 text-slate-400">Geographic shift exceeding commercial flight speed (&gt;800 km/h)</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-white">Refresh Token Replay / Theft</td>
                    <td className="py-2 font-mono text-rose-400 font-bold">+40 pts (to 95+)</td>
                    <td className="py-2 text-slate-400">Attempted reuse of an invalidated refresh token identifier</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="text-slate-400 font-bold">AUTOMATED RESPONSE THRESHOLDS:</div>
              <div className="text-slate-300">0–24  (LOW): Allow session normally</div>
              <div className="text-slate-300">25–49 (MEDIUM): Monitor session with heightened telemetry</div>
              <div className="text-slate-300">50–74 (HIGH): Challenge session / require step-up verification</div>
              <div className="text-rose-400 font-bold">75–100 (CRITICAL): Automatically revoke session and terminate token family</div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Telemetry Privacy & Data Minimization */}
        <Card className="glass-panel border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" />
              4. Privacy & Data Minimization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs text-slate-300 space-y-2.5 leading-relaxed">
            <p>
              TokenGuard adheres to strict cybersecurity data minimization principles:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Zero Plaintext Storage:</strong> Raw refresh tokens and user passwords are never stored in the database. Only one-way cryptographic SHA-256 hashes and bcrypt digests are retained.</li>
              <li><strong>Coarse Geolocation:</strong> Locations are approximated at metropolitan / regional granularity. No precise GPS coordinates or invasive device permissions are requested.</li>
              <li><strong>Privacy-Preserving Fingerprints:</strong> Device fingerprints are generated from standard non-sensitive HTTP headers (`User-Agent`, `Accept-Language`, display characteristics) hashed deterministically.</li>
              <li><strong>Masked Frontends:</strong> Sensitive session and token identifiers are masked (`sess_8f42••••91ac`) in all user interfaces to prevent shoulder-surfing and DOM scraping vulnerabilities.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
