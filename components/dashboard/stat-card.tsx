import React from "react";
import { Card, CardContent } from "../ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: "cyan" | "emerald" | "amber" | "rose" | "blue";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "cyan",
}: StatCardProps) {
  const colorMap = {
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]",
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    rose: "text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  };

  return (
    <Card className="glass-panel-hover overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
          <div className={cn("p-2 rounded-lg border", colorMap[accentColor])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">{value}</div>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full border",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
