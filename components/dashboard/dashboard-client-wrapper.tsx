"use client";

import React from "react";
import { TelemetryModeProvider, useTelemetryMode } from "@/lib/context/telemetry-mode-context";
import { FlaskConical, CheckCircle2 } from "lucide-react";

function ModeBanner() {
  const { mode, isSimulation, setMode } = useTelemetryMode();

  return (
    <div
      className={`px-4 py-1.5 text-xs flex items-center justify-between border-b ${
        isSimulation
          ? "bg-amber-950/40 border-amber-500/30 text-amber-200"
          : "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
      }`}
    >
      <div className="flex items-center gap-2 max-w-4xl truncate">
        {isSimulation ? (
          <>
            <FlaskConical className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-bold">SIMULATION / DEMO MODE ACTIVE:</span>
            <span className="text-amber-300/90 hidden sm:inline">
              Safe demonstration vectors enabled. No real attacks are being performed.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold">PRODUCTION TELEMETRY MODE:</span>
            <span className="text-emerald-300/90 hidden sm:inline">
              Displaying authentic database-backed authentication and session events only.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-slate-400 hidden md:inline">Mode:</span>
        <button
          onClick={() => setMode("production")}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
            !isSimulation
              ? "bg-emerald-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          Production
        </button>
        <button
          onClick={() => setMode("simulation")}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
            isSimulation
              ? "bg-amber-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              : "bg-slate-800/80 text-slate-400 hover:text-white"
          }`}
        >
          Demo / Simulation
        </button>
      </div>
    </div>
  );
}

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TelemetryModeProvider>
      <div className="flex-1 flex flex-col min-w-0">
        <ModeBanner />
        {children}
      </div>
    </TelemetryModeProvider>
  );
}
