"use client";

import React, { useEffect, useState } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ThreatLevelCard } from "@/components/dashboard/threat-level-card";
import { RiskTimelineChart } from "@/components/charts/risk-timeline-chart";
import { ThreatBreakdownCard } from "@/components/charts/threat-breakdown-card";
import { EventsByTypeChart } from "@/components/charts/events-by-type-chart";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { RiskExplanationCard } from "@/components/dashboard/risk-explanation-card";
import { EventDetailModal } from "@/components/dashboard/event-detail-modal";
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
  Ban,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime, maskIpAddress } from "@/lib/utils";
import { useTelemetryMode } from "@/lib/context/telemetry-mode-context";
import { SecurityEvent } from "@/lib/types";

export default function DashboardOverviewPage() {
  const { mode, isSimulation } = useTelemetryMode();
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const [stats, setStats] = useState<any>({
    overallRiskScore: 0,
    averageRiskScore: 0,
    activeSessionsCount: 1,
    suspiciousSessionsCount: 0,
    revokedSessionsCount: 0,
    totalSessionsCount: 1,
    factors: [],
    explanation: null,
    recentEvents: [],
  });

  const [analytics, setAnalytics] = useState<any>({
    riskTimeline: [],
    eventDistribution: [],
    riskLevelDistribution: [],
    sessionStatusDistribution: [],
    threatActivity: { normal: 90, suspicious: 10, blocked: 0 },
    tokenRotationActivity: { totalRotations: 0, tokenReplaysCaught: 0 },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [riskRes, analyticsRes] = await Promise.all([
        fetch(`/api/security/risk?mode=${mode}`),
        fetch(`/api/security/analytics?mode=${mode}`),
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
  }, [mode]);

  const riskScore = stats.overallRiskScore || 0;
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (riskScore >= 75) riskLevel = "CRITICAL";
  else if (riskScore >= 50) riskLevel = "HIGH";
  else if (riskScore >= 25) riskLevel = "MEDIUM";

  const tokenReplaysCaught = analytics.tokenRotationActivity?.tokenReplaysCaught || 0;

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Security Operations Console"
        subtitle="Continuous Token Hijack Defense & Live Telemetry Stream"
        onRefresh={fetchData}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Threat Lab Callout Banner */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <FlaskConical className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Interactive Threat Simulator Lab</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Ready (8 Vectors)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Safely simulate token replay attacks, impossible geographic travel, or rogue devices to observe automated real-time defense.
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

        {/* 6 Top Cards requested in Section 13 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            title="Active Sessions"
            value={stats.activeSessionsCount || 1}
            subtitle={`${stats.totalSessionsCount || 1} total session(s)`}
            icon={Radio}
            accentColor="emerald"
          />
          <StatCard
            title="High-Risk Sessions"
            value={stats.suspiciousSessionsCount || 0}
            subtitle={stats.suspiciousSessionsCount > 0 ? "Requires review" : "None flagged"}
            icon={AlertTriangle}
            accentColor={stats.suspiciousSessionsCount > 0 ? "amber" : "emerald"}
          />
          <StatCard
            title="Security Events"
            value={analytics.summary?.totalEvents || stats.recentEvents?.length || 0}
            subtitle={isSimulation ? "Includes simulation" : "Production events"}
            icon={Activity}
            accentColor="cyan"
          />
          <StatCard
            title="Revoked Sessions"
            value={stats.revokedSessionsCount || 0}
            subtitle="Automated / manual"
            icon={Ban}
            accentColor={stats.revokedSessionsCount > 0 ? "rose" : "cyan"}
          />

          <StatCard
            title="Token Replays"
            value={tokenReplaysCaught}
            subtitle={tokenReplaysCaught > 0 ? "Attacks neutralized" : "Zero replays"}
            icon={Flame}
            accentColor={tokenReplaysCaught > 0 ? "rose" : "emerald"}
          />
          <StatCard
            title="Current Risk"
            value={riskLevel}
            subtitle={`Score: ${riskScore} / 100`}
            icon={ShieldCheck}
            accentColor={riskLevel === "CRITICAL" ? "rose" : riskLevel === "HIGH" ? "amber" : "cyan"}
          />
        </div>

        {/* Explainable Risk Score Breakdown (Section 9) */}
        <RiskExplanationCard
          score={riskScore}
          level={riskLevel}
          factors={stats.factors || []}
          explanation={stats.explanation}
          action={stats.action}
        />

        {/* Threat Level Gauge & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ThreatLevelCard riskScore={riskScore} riskLevel={riskLevel} />
          </div>
          <div>
            <ThreatBreakdownCard threatActivity={analytics.threatActivity} />
          </div>
        </div>

        {/* Events Distribution Charts (Section 13) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                Security Incidents by Event Type
              </CardTitle>
              <p className="text-[11px] text-slate-500 font-mono">Frequency distribution across security vectors</p>
            </CardHeader>
            <CardContent className="pt-2">
              <EventsByTypeChart data={analytics.eventDistribution || []} />
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                Risk-Level Severity Breakdown
              </CardTitle>
              <p className="text-[11px] text-slate-500 font-mono">Severity ratio: Low, Medium, High, Critical</p>
            </CardHeader>
            <CardContent className="pt-2">
              <RiskDistributionChart data={analytics.riskLevelDistribution || []} />
            </CardContent>
          </Card>
        </div>

        {/* Risk Activity Chart & Recent Incidents Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Over Time Chart */}
          <div className="lg:col-span-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                    Risk Activity Timeline
                  </CardTitle>
                  <p className="text-[11px] text-slate-500 font-mono">Dynamic telemetry risk scoring across sessions</p>
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

          {/* Recent Security Incidents (Clickable for full explanation) */}
          <div>
            <Card className="glass-panel h-full flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Recent Security Events
                </CardTitle>
                <Link href="/dashboard/activity">
                  <span className="text-xs text-slate-400 hover:text-cyan-400 cursor-pointer">View All</span>
                </Link>
              </CardHeader>
              <CardContent className="flex-1 space-y-2.5 pt-1">
                {stats.recentEvents && stats.recentEvents.length > 0 ? (
                  stats.recentEvents.map((event: any) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="space-y-1 overflow-hidden pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono group-hover:text-cyan-300 transition-colors truncate">
                            {event.event_type.replace(/_/g, " ")}
                          </span>
                          {event.is_simulation && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              SIM
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{formatRelativeTime(event.created_at)}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{maskIpAddress(event.ip_address)}</span>
                        </div>
                      </div>
                      <Badge variant="risk" riskLevel={event.severity}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-slate-500 font-mono">
                    No security events recorded yet under current mode.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Interactive Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
