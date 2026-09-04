"use client";

import React, { useEffect, useState } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ThreatLevelCard } from "@/components/dashboard/threat-level-card";
import { RiskTimelineChart } from "@/components/charts/risk-timeline-chart";
import { ThreatBreakdownCard } from "@/components/charts/threat-breakdown-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Radio,
  AlertTriangle,
  Flame,
  Activity,
  ArrowUpRight,
  FlaskConical,
  RefreshCw,
  Clock,
  Laptop,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { motion } from "framer-motion";

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    overallRiskScore: 15,
    averageRiskScore: 10,
    activeSessionsCount: 1,
    suspiciousSessionsCount: 0,
    totalSessionsCount: 1,
    recentEvents: [],
  });
  const [analytics, setAnalytics] = useState<any>({
    riskTimeline: [],
    threatActivity: { normal: 90, suspicious: 10, blocked: 0 },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [riskRes, analyticsRes] = await Promise.all([
        fetch("/api/security/risk"),
        fetch("/api/security/analytics"),
      ]);

      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setStats(riskData);
      }

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData);
      }
    } catch (e) {
      console.error("Failed to load dashboard overview:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const riskScore = stats.overallRiskScore || 0;
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (riskScore >= 80) riskLevel = "CRITICAL";
  else if (riskScore >= 60) riskLevel = "HIGH";
  else if (riskScore >= 30) riskLevel = "MEDIUM";

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Security Operations Console"
        subtitle="Continuous Token Hijack Defense & Live Incident Feed"
        onRefresh={fetchData}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Quick Simulator Callout Banner */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FlaskConical className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Interactive Threat Simulator Lab</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate token theft replay attacks, impossible geographic travel, or rogue devices to observe automated real-time defense.
              </p>
            </div>
          </div>
          <Link href="/dashboard/simulator">
            <Button size="sm" variant="cyber" className="whitespace-nowrap">
              Launch Threat Simulator
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Top SOC Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Account Security"
            value="PROTECTED"
            subtitle="Zero-trust token rotation active"
            icon={ShieldCheck}
            accentColor="cyan"
          />
          <StatCard
            title="Active Sessions"
            value={stats.activeSessionsCount || 1}
            subtitle={`${stats.totalSessionsCount || 1} total registered session(s)`}
            icon={Radio}
            accentColor="emerald"
          />
          <StatCard
            title="Suspicious Sessions"
            value={stats.suspiciousSessionsCount || 0}
            subtitle={stats.suspiciousSessionsCount > 0 ? "Requires analyst review" : "No anomaly flagged"}
            icon={AlertTriangle}
            accentColor={stats.suspiciousSessionsCount > 0 ? "amber" : "emerald"}
          />
          <StatCard
            title="Current Risk"
            value={riskLevel}
            subtitle={`Peak composite score: ${riskScore}/100`}
            icon={Flame}
            accentColor={riskLevel === "CRITICAL" ? "rose" : riskLevel === "HIGH" ? "amber" : "cyan"}
          />
        </div>

        {/* Threat Level Gauge & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ThreatLevelCard riskScore={riskScore} riskLevel={riskLevel} />
          </div>
          <div>
            <ThreatBreakdownCard threatActivity={analytics.threatActivity} />
          </div>
        </div>

        {/* Risk Activity Chart & Live Events Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Over Time Chart */}
          <div className="lg:col-span-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Risk Activity Timeline
                  </CardTitle>
                  <p className="text-xs text-slate-500 font-mono">Dynamic telemetry risk scoring across sessions</p>
                </div>
                <Link href="/dashboard/analytics">
                  <Button variant="ghost" size="sm" className="text-xs text-cyan-400 hover:text-cyan-300 p-0 h-auto">
                    Full Analytics <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                <RiskTimelineChart data={analytics.riskTimeline} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Incidents */}
          <div>
            <Card className="glass-panel h-full flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Recent Security Events
                </CardTitle>
                <Link href="/dashboard/activity">
                  <span className="text-xs text-slate-400 hover:text-cyan-400 cursor-pointer">View All</span>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-1">
                {stats.recentEvents && stats.recentEvents.length > 0 ? (
                  stats.recentEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white font-mono">
                            {event.event_type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{formatRelativeTime(event.created_at)}</span>
                        </div>
                      </div>
                      <Badge variant="risk" riskLevel={event.severity}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-slate-500 font-mono">
                    No security events recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
