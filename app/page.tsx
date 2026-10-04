"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  KeyRound,
  Laptop,
  Globe2,
  Cpu,
  AlertOctagon,
  Lock,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Zap,
  RefreshCw,
  EyeOff,
  Radio,
  FlaskConical,
  BookOpen,
  Server,
  Layers,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    icon: RefreshCw,
    title: "Token Replay Detection",
    description: "Strict refresh-token rotation with historical family hash validation. Catches and invalidates stolen credentials upon any unauthorized replay.",
    color: "rose",
  },
  {
    icon: Radio,
    title: "Session Monitoring",
    description: "Continuous telemetry stream analysis tracking active session duration, concurrent endpoints, and state transitions in real time.",
    color: "cyan",
  },
  {
    icon: Laptop,
    title: "Device Anomaly Detection",
    description: "Privacy-preserving client fingerprinting comparing browser engines, operating systems, and device identifiers against trusted baselines.",
    color: "blue",
  },
  {
    icon: Globe2,
    title: "IP & Impossible Travel",
    description: "Geographic displacement velocity analysis. Computes required travel speed across session timestamps to catch distributed proxy hijacking.",
    color: "purple",
  },
  {
    icon: Cpu,
    title: "Explainable Risk Scoring",
    description: "Dynamic composite risk index (0–100) with factor-by-factor transparency, human-readable explanations, and half-life decay.",
    color: "emerald",
  },
  {
    icon: Zap,
    title: "Automated Revocation",
    description: "Instantaneous policy-driven revocation of compromised session trees upon token replay or critical anomaly detection with zero latency.",
    color: "amber",
  },
];

const pipelineSteps = [
  { step: "01", name: "Authenticate", desc: "User credentials verified, JWT access token & rotated refresh token issued." },
  { step: "02", name: "Monitor", desc: "Client telemetry (IP, OS, browser, cadence) continuously ingested." },
  { step: "03", name: "Analyze", desc: "Travel velocity, device pairing, and token family rotation checked." },
  { step: "04", name: "Score", desc: "Multi-signal risk engine computes 0–100 score with factor breakdown." },
  { step: "05", name: "Detect", desc: "Token replay, impossible travel, or rogue device anomalies identified." },
  { step: "06", name: "Respond", desc: "Automated defense triggers session revocation or step-up challenge." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 cyber-grid relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background glowing orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10 border-b border-slate-800/60">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="font-bold text-lg tracking-wide text-white">
            Token<span className="text-cyan-400">Guard</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hidden sm:flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span>Docs</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm" className="shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-6 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          <span>Professional Token Security & Zero-Trust Defense Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
        >
          Protect Sessions. Detect Token Theft.
          <span className="block text-cyan-400 mt-2">
            Respond Automatically.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
        >
          TokenGuard empowers engineering and SOC teams to detect token theft, prevent credential replay attacks, analyze device anomalies, and automatically isolate compromised sessions in real time.
        </motion.p>

        {/* 3 Main Action Buttons requested in section 23 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/dashboard">
            <Button size="lg" variant="cyber" className="text-base shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <Shield className="h-4 w-4 mr-2" />
              Open Security Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/simulator">
            <Button size="lg" variant="secondary" className="text-base border-slate-700 bg-slate-900/80 hover:bg-slate-800">
              <FlaskConical className="h-4 w-4 mr-2 text-cyan-400" />
              Try Security Lab
            </Button>
          </Link>
          <Link href="/docs">
            <Button size="lg" variant="outline" className="text-base border-slate-700 text-slate-300 hover:text-white">
              <BookOpen className="h-4 w-4 mr-2 text-slate-400" />
              View Documentation
            </Button>
          </Link>
        </motion.div>

        {/* Live SOC Demonstration Preview */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 text-left max-w-4xl mx-auto rounded-xl border border-cyan-500/30 bg-[#0a0f1d]/90 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">tokenguard-event-engine://telemetry</span>
            </div>
            <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              DEFENSE: REAL-TIME ACTIVE
            </div>
          </div>

          <div className="font-mono text-xs space-y-2 text-slate-300">
            <div className="text-slate-500 font-semibold">[21:00:12] TokenGuard Engine v2.0 Initialized... Telemetry stream online</div>
            <div className="text-emerald-400">
              ✓ Cryptographic Refresh Token Rotation Active (15m Short-Lived Access / 7d Refresh with Family Vault)
            </div>
            <div className="text-cyan-400">
              ℹ Device Telemetry: SHA-256 fingerprinting active across client headers
            </div>
            <div className="text-amber-400">
              ⚠ INCIDENT: Invalidated refresh token re-presented from IP 45.33.32.156 (Bucharest)
            </div>
            <div className="text-rose-400 font-bold">
              ⚡ AUTOMATED RESPONSE: Compromised session [sess_8f42••••91ac] REVOKED IMMEDIATELY. Risk score: 95 (CRITICAL).
            </div>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
            <span>DEFENSE PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            How TokenGuard Protects Authentication
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            From initial user authentication to continuous real-time threat evaluation and automated revocation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {pipelineSteps.map((p, idx) => (
            <div
              key={p.step}
              className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-mono font-bold text-cyan-400 mb-1.5">{p.step}</div>
                <h4 className="text-sm font-bold text-white mb-1">{p.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
              <div className="pt-3 flex justify-end">
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/60 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <span>CORE CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Startup-Grade Security Features
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Engineered with defense-in-depth principles to detect, challenge, and eliminate token theft vectors in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <Card className="h-full glass-panel-hover border border-slate-800 hover:border-cyan-500/40 transition-all p-6">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Security Architecture Diagram Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-3">
            <span>ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Security Architecture & Zero-Trust Verification
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            How TokenGuard sits between clients, API routes, and database telemetry to isolate compromised sessions.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl border border-cyan-500/30 bg-[#090e1c] shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400">
                <Laptop className="h-4 w-4" />
                <span>1. CLIENT LAYER</span>
              </div>
              <p className="text-xs text-slate-300">
                Browser / Mobile Client presenting short-lived JWT (15m) & HttpOnly rotated Refresh Token (7d).
              </p>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                Client Telemetry: User-Agent, Fingerprint, IP, Geo-IP, Rotation Hash
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400">
                <Cpu className="h-4 w-4" />
                <span>2. TOKENGUARD CORE</span>
              </div>
              <p className="text-xs text-slate-300">
                Evaluates token replay cache, travel velocity (&gt;800 km/h), device pairing, and dynamic 0–100 risk score.
              </p>
              <div className="text-[11px] font-mono text-cyan-300 bg-slate-950 p-2.5 rounded border border-cyan-800/60">
                Decision: ALLOW | MONITOR | CHALLENGE | REVOKE
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-400">
                <Server className="h-4 w-4" />
                <span>3. SUPABASE DB & AUDIT</span>
              </div>
              <p className="text-xs text-slate-300">
                Encrypted session records, token family vault, security events audit trail, and SOC notifications.
              </p>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                Tables: sessions, security_events, devices, alerts, failed_logins
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Lab Highlight Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60 relative z-10">
        <div className="glass-panel p-8 sm:p-12 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-purple-950/40 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>INTERACTIVE THREAT LAB</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Safely Simulate Token Theft & Attack Vectors
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Observe how TokenGuard detects and neutralizes attacks in real time without compromising real credentials. Simulate token replay, impossible travel, rogue devices, and scraper bots in a sandboxed educational environment.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/simulator">
                <Button size="lg" variant="cyber">
                  Launch Threat Lab
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="w-full md:w-80 p-5 rounded-xl bg-[#060a16] border border-cyan-500/30 text-xs font-mono space-y-2 text-slate-300 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Attack Scenarios</span>
              <span className="text-[10px] text-slate-500">8 vectors</span>
            </div>
            <div className="text-rose-400">⚡ Token Replay & Theft Attack</div>
            <div className="text-amber-400">✈ Impossible Travel Velocity</div>
            <div className="text-cyan-300">💻 Unrecognized Device Login</div>
            <div className="text-purple-300">🤖 Headless Crawler Scraping</div>
            <div className="text-blue-300">🌐 Rapid IP Address Shift</div>
            <div className="text-emerald-400">🔐 Legitimate Token Rotation</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#04060d] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="font-bold text-white tracking-wide text-lg">
              Token<span className="text-cyan-400">Guard</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">| Cybersecurity SOC Suite</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/docs" className="hover:text-cyan-400 transition-colors">Documentation</Link>
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
            <Link href="/dashboard/simulator" className="hover:text-cyan-400 transition-colors">Security Lab</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
