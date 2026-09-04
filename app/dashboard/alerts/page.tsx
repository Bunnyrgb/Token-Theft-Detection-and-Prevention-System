"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BellRing,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "resolved">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/security/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: string, updates: { read?: boolean; resolved?: boolean }) => {
    try {
      setActionLoading(alertId);
      const res = await fetch(`/api/security/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await fetchAlerts();
      }
    } catch (e) {
      console.error("Failed to update alert:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === "unread") return !a.read;
    if (activeTab === "resolved") return a.resolved;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Security Alerts"
        subtitle="Real-time notifications of token anomalies, unrecognized devices, and policy enforcement"
        onRefresh={fetchAlerts}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Incident Alerts Feed</h2>
              <p className="text-xs text-slate-400">
                You have {unreadCount} unacknowledged security alert{unreadCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "all" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "unread" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "resolved" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-white"
              }`}
            >
              Resolved ({alerts.filter((a) => a.resolved).length})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs">
              Querying security incident alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-xl border border-slate-800">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white">All Clear!</h3>
              <p className="text-xs text-slate-400 mt-1">No security alerts found under this view.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`glass-panel-hover border transition-all ${
                  !alert.read
                    ? "border-cyan-500/40 bg-[#0d1629]/90 shadow-[0_0_20px_rgba(0,240,255,0.12)]"
                    : alert.resolved
                    ? "border-emerald-500/20 opacity-70 bg-[#080d18]"
                    : "border-slate-800"
                }`}
              >
                <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant="risk" riskLevel={alert.severity}>
                        {alert.severity} RISK
                      </Badge>
                      <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                      {!alert.read && (
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(alert.created_at)}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link href="/dashboard/sessions">
                      <Button variant="outline" size="sm" className="text-xs">
                        Review Session
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>

                    {!alert.read ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, { read: true })}
                        isLoading={actionLoading === alert.id}
                        className="text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Mark Read
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, { read: false })}
                        isLoading={actionLoading === alert.id}
                        className="text-xs text-slate-400"
                      >
                        <EyeOff className="h-3.5 w-3.5 mr-1" />
                        Mark Unread
                      </Button>
                    )}

                    {!alert.resolved ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(alert.id, { resolved: true, read: true })}
                        isLoading={actionLoading === alert.id}
                        className="text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Resolve
                      </Button>
                    ) : (
                      <Badge variant="success" className="text-xs">
                        Resolved
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
