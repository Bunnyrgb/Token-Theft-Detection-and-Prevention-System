"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RiskTimelineChart } from "@/components/charts/risk-timeline-chart";
import { DeviceDistributionChart } from "@/components/charts/device-distribution-chart";
import { ThreatBreakdownCard } from "@/components/charts/threat-breakdown-card";
import { EventsByTypeChart } from "@/components/charts/events-by-type-chart";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  BarChart3,
  TrendingUp,
  Shield,
  Laptop,
  Radio,
  Flame,
  Activity,
  RefreshCw,
  PieChart as PieIcon,
} from "lucide-react";
import { useTelemetryMode } from "@/lib/context/telemetry-mode-context";

export default function AnalyticsPage() {
  const { mode } = useTelemetryMode();
  const [data, setData] = useState({
    riskTimeline: [],
    eventDistribution: [],
    riskLevelDistribution: [],
    sessionStatusDistribution: [],
    deviceDistribution: [],
    threatActivity: { normal: 90, suspicious: 10, blocked: 0 },
    tokenRotationActivity: { totalRotations: 0, tokenReplaysCaught: 0, activeRotatedSessions: 0 },
    summary: { totalEvents: 0, totalDevices: 0, activeSessions: 0, revokedSessions: 0, tokenReplays: 0 },
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/security/analytics?mode=${mode}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [mode]);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Security Analytics & Visual Intelligence"
        subtitle="Real-time telemetry aggregation, threat distributions, and anomaly vectors"
        onRefresh={fetchAnalytics}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Events"
            value={data.summary?.totalEvents || 0}
            subtitle="Immutable audit entries"
            icon={Activity}
            accentColor="cyan"
          />
          <StatCard
            title="Active Streams"
            value={data.summary?.activeSessions || 0}
            subtitle="Live client sessions"
            icon={Radio}
            accentColor="emerald"
          />
          <StatCard
            title="Token Rotations"
            value={data.tokenRotationActivity?.totalRotations || 0}
            subtitle="Cryptographic cycles"
            icon={RefreshCw}
            accentColor="blue"
          />
          <StatCard
            title="Replays Caught"
            value={data.tokenRotationActivity?.tokenReplaysCaught || 0}
            subtitle="Theft vectors neutralized"
            icon={Flame}
            accentColor={data.tokenRotationActivity?.tokenReplaysCaught > 0 ? "rose" : "emerald"}
          />
          <StatCard
            title="Revoked Sessions"
            value={data.summary?.revokedSessions || 0}
            subtitle="Isolated endpoints"
            icon={Shield}
            accentColor="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  Dynamic Risk Activity Over Time
                </CardTitle>
                <p className="text-[11px] text-slate-500 font-mono">
                  Continuous multi-signal threat evaluation stream
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <RiskTimelineChart data={data.riskTimeline} />
              </CardContent>
            </Card>
          </div>

          <div>
            <ThreatBreakdownCard threatActivity={data.threatActivity} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Security Incidents by Event Type
              </CardTitle>
              <p className="text-[11px] text-slate-500 font-mono">
                Incidents categorized across canonical telemetry event types
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <EventsByTypeChart data={data.eventDistribution || []} />
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                <PieIcon className="h-4 w-4 text-purple-400" />
                Risk Severity Level Breakdown
              </CardTitle>
              <p className="text-[11px] text-slate-500 font-mono">
                Distribution across Low, Medium, High, and Critical thresholds
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <RiskDistributionChart data={data.riskLevelDistribution || []} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
                <Laptop className="h-4 w-4 text-blue-400" />
                Client Device Telemetry Distribution
              </CardTitle>
              <p className="text-[11px] text-slate-500 font-mono">
                Desktop vs Mobile vs Tablet endpoint environments
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <DeviceDistributionChart data={data.deviceDistribution} />
            </CardContent>
          </Card>

          <Card className="glass-panel p-6 flex flex-col justify-center space-y-4">
            <div className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Token Rotation Health & Telemetry Summary
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500">Active Rotated Sessions:</div>
                <div className="text-white font-mono font-bold text-sm mt-0.5">
                  {data.tokenRotationActivity?.activeRotatedSessions || 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-500">Replay Attempts Blocked:</div>
                <div className="text-rose-400 font-mono font-bold text-sm mt-0.5">
                  {data.tokenRotationActivity?.tokenReplaysCaught || 0}
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every token rotation vaults previous refresh token identifiers. If any retired token hash is presented again, the session tree is instantly severed to block adversary exploitation.
            </p>
          </Card>
        </div>
      </main>

    </div>
  );
}
