"use client";

import React, { useState, useEffect } from "react";
import { Bell, ShieldCheck, ShieldAlert, Wifi, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";

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

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live SOC Monitor Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>SYSTEM ACTIVE</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-mono text-[11px]">{time}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleManualRefresh}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all text-xs flex items-center gap-1.5"
          title="Refresh Data Feed"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>

        {/* Quick Simulator link */}
        <Link
          href="/dashboard/simulator"
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] flex items-center gap-1.5"
        >
          <span>Threat Lab</span>
        </Link>
      </div>
    </header>
  );
}
