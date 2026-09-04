"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RiskTimelineChart } from "@/components/charts/risk-timeline-chart";
import { DeviceDistributionChart } from "@/components/charts/device-distribution-chart";
import { LoginActivityChart } from "@/components/charts/login-activity-chart";
import { ThreatBreakdownCard } from "@/components/charts/threat-breakdown-card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  BarChart3,
  TrendingUp,
  Shield,
  Laptop,
  Radio,
  Flame,
  Activity,
  Layers,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({
    riskTimeline: [],
    eventDistribution: [],
    deviceDistribution: [],
    threatActivity: { normal: 82, suspicious: 13, blocked: 5 },
    loginActivity: [],
    summary: { totalEvents: 0, totalDevices: 0, activeSessions: 0, revokedSessions: 0 },
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/security/analytics");
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
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Security Analytics & Visual Intelligence"
        subtitle="Real-time telemetry aggregation, threat distributions, and anomaly vectors"
        onRefresh={fetchAnalytics}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Analytics Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events Logged"
            value={data.summary?.totalEvents || 0}
            subtitle="Immutable audit entries"
            icon={Activity}
            accentColor="cyan"
          />
          <StatCard
            title="Enrolled Devices"
            value={data.summary?.totalDevices || 0}
            subtitle="Client fingerprints in registry"
            icon={Laptop}
            accentColor="blue"
          />
          <StatCard
            title="Active Sessions"
            value={data.summary?.activeSessions || 0}
            subtitle="Live authentication streams"
            icon={Radio}
            accentColor="emerald"
          />
          <StatCard
            title="Revoked Sessions"
            value={data.summary?.revokedSessions || 0}
            subtitle="Compromised / closed streams"
            icon={Flame}
            accentColor={data.summary?.revokedSessions > 0 ? "rose" : "cyan"}
          />
        </div>

        {/* Charts Grid Row 1: Risk Timeline & Threat Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="glass-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  Risk Score Over Time (Chronological Feed)
                </CardTitle>
                <p className="text-xs text-slate-500 font-mono">
                  Calculated from real-time session events and anomaly signals
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

        {/* Charts Grid Row 2: Login Activity & Device Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                Login & Token Issuance Activity (Weekly)
              </CardTitle>
              <p className="text-xs text-slate-500 font-mono">
                Authentication spikes across days of the week
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <LoginActivityChart data={data.loginActivity} />
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                Client Device Distribution
              </CardTitle>
              <p className="text-xs text-slate-500 font-mono">
                Desktop vs Mobile vs Tablet client breakdown
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <DeviceDistributionChart data={data.deviceDistribution} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
