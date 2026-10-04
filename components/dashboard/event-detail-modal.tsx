"use client";

import React from "react";
import { Shield, AlertTriangle, Flame, Info, CheckCircle2, Bot, Sparkles, X, Clock, Laptop, Globe2, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { maskIpAddress, formatRelativeTime } from "@/lib/utils";
import { SecurityEvent } from "@/lib/types";

interface EventDetailModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  if (!event) return null;

  const expl = (event as any).explanation || {
    whatHappened: event.description || "Security event logged from client telemetry.",
    whyIsThisDangerous: "Anomalous actions in session credentials can indicate token exfiltration or hijacking.",
    howTokenGuardResponds: "Evaluates multi-signal risk and isolates compromised sessions upon critical threshold.",
    howCanItBePrevented: "Enforce strict refresh-token rotation and monitor session velocity.",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b1021] border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Badge variant="risk" riskLevel={event.severity}>
                {event.severity}
              </Badge>
              {event.is_simulation && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  Simulation Event
                </span>
              )}
              <span className="text-xs text-slate-500 font-mono">
                ID: {event.id.slice(0, 8)}••••
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              {event.event_type.replace(/_/g, " ")}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Core Event Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Risk Score</div>
            <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
              {event.risk_score} / 100
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Session ID</div>
            <div className="text-xs font-bold text-slate-200 font-mono mt-1 truncate">
              {event.session_id ? `${event.session_id.slice(0, 8)}••••` : "Global"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Origin IP</div>
            <div className="text-xs font-bold text-slate-200 font-mono mt-1">
              {maskIpAddress(event.ip_address)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Recorded At</div>
            <div className="text-xs font-bold text-slate-200 mt-1">
              {formatRelativeTime(event.created_at)}
            </div>
          </div>
        </div>

        {/* Reason & Action Taken */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-slate-400 font-mono text-[11px] font-bold uppercase text-cyan-400">
              Description & Reason:
            </div>
            <p className="text-slate-200 leading-relaxed">
              {event.description || "Security event logged during authentication check."}
            </p>
            {event.reason && (
              <p className="text-slate-400 text-[11px] pt-1">
                <span className="font-semibold text-slate-300">Underlying Cause:</span> {event.reason}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-slate-400 font-mono text-[11px] font-bold uppercase text-emerald-400">
              Automated Action Taken:
            </div>
            <p className="text-slate-200 font-medium">
              {event.action_taken || "Logged to immutable security audit trail."}
            </p>
          </div>
        </div>

        {/* AI Security Assistant Telemetry Analysis Panel */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-blue-950/20 space-y-3">
          <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
              SOC Security Analysis
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="font-bold text-slate-200 mb-0.5">What happened?</div>
              <p className="text-slate-400 leading-relaxed">{expl.whatHappened}</p>
            </div>
            <div>
              <div className="font-bold text-slate-200 mb-0.5">Why is this dangerous?</div>
              <p className="text-slate-400 leading-relaxed">{expl.whyIsThisDangerous}</p>
            </div>
            <div>
              <div className="font-bold text-slate-200 mb-0.5">How does TokenGuard respond?</div>
              <p className="text-slate-400 leading-relaxed">{expl.howTokenGuardResponds}</p>
            </div>
            <div>
              <div className="font-bold text-slate-200 mb-0.5">How can it be prevented?</div>
              <p className="text-slate-400 leading-relaxed">{expl.howCanItBePrevented}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
