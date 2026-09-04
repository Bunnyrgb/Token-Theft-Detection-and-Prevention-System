import React from "react";
import { Card, CardContent } from "../ui/card";
import { ShieldAlert, ShieldCheck, AlertTriangle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskLevel } from "@/lib/types";

export function ThreatLevelCard({
  riskScore = 0,
  riskLevel = "LOW",
}: {
  riskScore?: number;
  riskLevel?: RiskLevel;
}) {
  const configs = {
    LOW: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      icon: ShieldCheck,
      desc: "All active sessions are verified and within safe operating parameters.",
      barColor: "bg-emerald-400",
    },
    MEDIUM: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]",
      icon: AlertTriangle,
      desc: "Minor geographic or device changes observed. Continuous monitoring engaged.",
      barColor: "bg-blue-400",
    },
    HIGH: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      icon: AlertTriangle,
      desc: "Suspicious session signals detected. Re-authentication challenged.",
      barColor: "bg-amber-400",
    },
    CRITICAL: {
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
      glow: "shadow-[0_0_25px_rgba(244,63,94,0.3)]",
      icon: Flame,
      desc: "Potential Token Hijacking or Replay Attack! Counter-measures triggered.",
      barColor: "bg-rose-500",
    },
  };

  const current = configs[riskLevel] || configs.LOW;
  const Icon = current.icon;

  return (
    <Card className={cn("glass-panel overflow-hidden border", current.border, current.glow)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-slate-400">
              SOC Threat Level
            </span>
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5", current.bg, current.color, current.border)}>
            <Icon className="h-3.5 w-3.5" />
            <span>{riskLevel} THREAT</span>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs text-slate-400 font-medium">Composite Risk Score</div>
            <div className={cn("text-4xl font-extrabold font-mono", current.color)}>
              {riskScore} <span className="text-lg text-slate-500 font-normal">/ 100</span>
            </div>
          </div>
        </div>

        {/* Dynamic Risk Gauge Bar */}
        <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800 mb-4 overflow-hidden relative">
          <div
            className={cn("h-full rounded-full transition-all duration-500", current.barColor)}
            style={{ width: `${Math.max(5, Math.min(100, riskScore))}%` }}
          />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">{current.desc}</p>
      </CardContent>
    </Card>
  );
}
