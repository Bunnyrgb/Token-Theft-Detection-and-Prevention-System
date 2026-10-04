"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, ShieldAlert, ChevronDown, ChevronUp, Info, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { RiskFactor, RiskExplanation, RiskLevel } from "@/lib/types";
import Link from "next/link";

interface RiskExplanationCardProps {
  score: number;
  level: RiskLevel;
  factors?: RiskFactor[];
  explanation?: RiskExplanation;
  action?: string;
}

export function RiskExplanationCard({
  score,
  level,
  factors = [],
  explanation,
  action,
}: RiskExplanationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultExplanation: RiskExplanation = explanation || {
    whatHappened: factors.length > 0
      ? `Identified ${factors.length} active risk vector(s) in authentication telemetry.`
      : "Standard authenticated baseline session.",
    whyIsThisRisky: "Anomalous credentials or unrecognized networks can indicate session token compromise.",
    actionTaken: action || (score >= 75 ? "Session revoked" : score >= 50 ? "Challenge required" : "Session monitored"),
    userRecommendation: "Review active sessions in your dashboard and revoke unrecognized devices.",
  };

  return (
    <Card className="glass-panel border-cyan-500/30 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Explainable Risk Engine Analysis
            </CardTitle>
            <p className="text-[11px] text-slate-400 font-mono">Factor-by-factor transparent score composition</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="risk" riskLevel={level}>
            {level} RISK ({score}/100)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Factor Breakdown Table */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Contributing Telemetry Factors</span>
            <span className="text-[11px] font-mono text-cyan-400">{factors.length} active signals</span>
          </div>

          <div className="space-y-1.5">
            {factors.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Baseline Session (+0 pts) — No suspicious anomalies flagged.</span>
              </div>
            ) : (
              factors.map((f, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white">{f.factor}</div>
                    {f.description && <div className="text-[11px] text-slate-400">{f.description}</div>}
                  </div>
                  <div className="font-mono font-bold text-cyan-400 ml-3 shrink-0">
                    +{f.score}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total Score Summary Line */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 uppercase font-bold">Total Composite Score:</span>
          <span className="text-cyan-300 font-extrabold text-sm">{score} / 100</span>
        </div>

        {/* Explainability Grid: 4 Core Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              <span>What happened?</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{defaultExplanation.whatHappened}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Why is this risky?</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{defaultExplanation.whyIsThisRisky}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>What action was taken?</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{defaultExplanation.actionTaken}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>What should the user do?</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{defaultExplanation.userRecommendation}</p>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-xs">
          <Link href="/dashboard/simulator" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            <span>Test risk scenarios in Threat Lab</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <span className="text-slate-500 font-mono text-[11px]">Decay: 24h half-life</span>
        </div>
      </CardContent>
    </Card>
  );
}
