"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, RefreshCw, BookOpen, FlaskConical, Layers } from "lucide-react";
import Link from "next/link";
import { useTelemetryMode } from "@/lib/context/telemetry-mode-context";

export function DashboardTopbar({
  title = "Security Operations Console",
  subtitle = "Real-time Token Theft Detection & Telemetry Feed",
  onRefresh,
}: {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [time, setTime] = useState("");
  const { mode, isSimulation, setMode } = useTelemetryMode();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toTimeString().split(" ")[0] + " UTC");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#080d1a]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-400 font-mono hidden sm:block">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Telemetry Mode Toggle Switch */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => setMode("production")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              !isSimulation
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Production Data</span>
          </button>
          <button
            onClick={() => setMode("simulation")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              isSimulation
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FlaskConical className="h-3 w-3 text-amber-400" />
            <span>Simulation Lab</span>
          </button>
        </div>

        {/* Live SOC Monitor Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="hidden xl:inline">LIVE FEED</span>
          <span className="text-slate-400 font-mono text-[11px]">{time}</span>
        </div>

        {/* Documentation link */}
        <Link
          href="/dashboard/docs"
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all text-xs flex items-center gap-1.5"
          title="Security Architecture & Threat Documentation"
        >
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Docs</span>
        </Link>

        {/* Refresh button */}
        <button
          onClick={handleManualRefresh}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all text-xs flex items-center gap-1.5"
          title="Refresh Data Feed"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>

        {/* Quick Simulator link */}
        <Link
          href="/dashboard/simulator"
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] flex items-center gap-1.5"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          <span>Threat Lab</span>
        </Link>
      </div>
    </header>
  );
}
