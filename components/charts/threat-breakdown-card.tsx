import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ShieldCheck, AlertCircle, Ban } from "lucide-react";

export function ThreatBreakdownCard({
  threatActivity = { normal: 82, suspicious: 13, blocked: 5 },
}: {
  threatActivity?: { normal: number; suspicious: number; blocked: number };
}) {
  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Threat Activity Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Normal */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Normal Activity
            </span>
            <span className="font-mono text-slate-200">{threatActivity.normal}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${threatActivity.normal}%` }} />
          </div>
        </div>

        {/* Suspicious */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" /> Suspicious Activity
            </span>
            <span className="font-mono text-slate-200">{threatActivity.suspicious}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${threatActivity.suspicious}%` }} />
          </div>
        </div>

        {/* Blocked / Revoked */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Ban className="h-3.5 w-3.5" /> Blocked / Neutralized
            </span>
            <span className="font-mono text-slate-200">{threatActivity.blocked}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${threatActivity.blocked}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
