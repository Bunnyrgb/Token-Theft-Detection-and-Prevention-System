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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    icon: KeyRound,
    title: "Token Monitoring",
    description: "Real-time telemetry tracking of active tokens, expiration timestamps, cryptographic hashes, and rotation cycles.",
    color: "cyan",
  },
  {
    icon: Laptop,
    title: "Device Tracking",
    description: "Privacy-preserving device fingerprinting across browsers, OS, and client environments to detect rogue devices.",
    color: "blue",
  },
  {
    icon: Globe2,
    title: "IP Analysis",
    description: "Geographic displacement and impossible-travel anomaly detection to prevent cross-border token hijacking.",
    color: "purple",
  },
  {
    icon: Cpu,
    title: "Risk Scoring",
    description: "Configurable multi-factor risk engine computing instant threat indices (0-100) based on weighted signals.",
    color: "emerald",
  },
  {
    icon: AlertOctagon,
    title: "Anomaly Detection",
    description: "Detection of concurrent global sessions, bot/crawler user-agents, and rapid abnormal request burst velocities.",
    color: "amber",
  },
  {
    icon: Zap,
    title: "Automatic Session Revocation",
    description: "Instantaneous revocation of compromised sessions upon refresh token reuse or replay attacks with zero latency.",
    color: "rose",
  },
];

const securityFlowSteps = [
  { step: "01", title: "Authentication", desc: "User credentials verified & hashed" },
  { step: "02", title: "Token Issued", desc: "Access & Rotated Refresh token generated" },
  { step: "03", title: "Session Monitoring", desc: "Continuous client telemetry ingestion" },
  { step: "04", title: "Behavior Analysis", desc: "Device, IP & Geo-vector inspection" },
  { step: "05", title: "Risk Scoring", desc: "Dynamic 0-100 composite threat calculation" },
  { step: "06", title: "Threat Detection", desc: "Token replay or hijacking identified" },
  { step: "07", title: "Preventive Action", desc: "Immediate session termination & alert" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 cyber-grid relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background glowing orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

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

        <div className="flex items-center gap-4">
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
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-6 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          <span>Next-Generation Cybersecurity & SOC Defense</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
        >
          Token<span className="text-cyan-400">Guard</span>
          <span className="block text-2xl sm:text-4xl md:text-5xl font-bold text-slate-300 mt-2 font-mono">
            Token Theft Detection & Prevention System
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Detect suspicious authentication activity, identify potentially compromised sessions, and automatically protect user accounts using secure session management, device/IP monitoring, risk scoring, anomaly detection, token rotation, and instant session revocation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/register">
            <Button size="lg" variant="cyber" className="w-full sm:w-auto text-base">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base border-slate-700">
              View Security Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Live SOC Mock Terminal Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-left max-w-4xl mx-auto rounded-xl border border-cyan-500/30 bg-[#0a0f1d]/90 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">tokenguard-threat-engine://live-stream</span>
            </div>
            <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              DEFENSE: ENGAGED
            </div>
          </div>

          <div className="font-mono text-xs space-y-2 text-slate-300">
            <div className="text-slate-500 font-semibold">[00:01.04] Initializing TokenGuard Defense Cluster... OK</div>
            <div className="text-emerald-400">
              ✓ Cryptographic Refresh Token Rotation Active (15m Access / 7d Refresh with Replay Guard)
            </div>
            <div className="text-cyan-400">
              ℹ Device Telemetry: SHA-256 fingerprinting active across client headers
            </div>
            <div className="text-amber-400">
              ⚠ SIMULATION ALERT: Inbound token replay attempt caught from IP 45.33.32.156 (Bucharest)
            </div>
            <div className="text-rose-400 font-bold">
              ⚡ ACTION TAKEN: Compromised session [sess_8f42••••91ac] REVOKED IMMEDIATELY. Risk score: 95 (CRITICAL).
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/60 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">
            Comprehensive Cybersecurity Safeguards
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
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full glass-panel-hover border border-slate-800 hover:border-cyan-500/40 transition-all p-6">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Security Flow Architecture Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <span>PIPELINE SPECIFICATION</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
            Real-Time Security Enforcement Flow
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            How TokenGuard protects user authentication from generation to continuous threat evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {securityFlowSteps.map((s, idx) => (
            <div
              key={s.step}
              className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all relative overflow-hidden"
            >
              <div className="text-xs font-mono font-bold text-cyan-400 mb-2">{s.step} // PIPELINE</div>
              <h4 className="text-base font-bold text-white mb-1.5">{s.title}</h4>
              <p className="text-xs text-slate-400">{s.desc}</p>
            </div>
          ))}
          <div className="glass-panel p-5 rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-blue-950/40 flex flex-col justify-center items-center text-center">
            <Lock className="h-6 w-6 text-cyan-400 mb-2" />
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Automated Shield</div>
            <div className="text-[11px] text-slate-400 mt-1">Zero Trust Validation</div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
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
            <span>Built with Next.js, Supabase PostgreSQL, Jose & Framer Motion</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
