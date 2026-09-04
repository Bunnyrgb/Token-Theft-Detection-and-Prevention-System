"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Search,
  Filter,
  Globe2,
  Laptop,
  Clock,
  ShieldAlert,
  Flame,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  Zap,
} from "lucide-react";
import { maskIpAddress, formatRelativeTime } from "@/lib/utils";

const eventTypes = [
  "ALL",
  "LOGIN",
  "LOGOUT",
  "TOKEN_CREATED",
  "TOKEN_REFRESHED",
  "TOKEN_REVOKED",
  "SESSION_CREATED",
  "SESSION_REVOKED",
  "NEW_DEVICE",
  "NEW_IP",
  "RISK_INCREASED",
  "SUSPICIOUS_ACTIVITY",
  "TOKEN_REUSE_DETECTED",
];

const severities = ["ALL", "INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function ActivityLogsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = "/api/security/events?limit=100";
      if (selectedType !== "ALL") url += `&eventType=${selectedType}`;
      if (selectedSeverity !== "ALL") url += `&severity=${selectedSeverity}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to load activity events:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedType, selectedSeverity]);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.event_type.toLowerCase().includes(q) ||
      ev.ip_address.toLowerCase().includes(q) ||
      ev.severity.toLowerCase().includes(q) ||
      (ev.metadata && JSON.stringify(ev.metadata).toLowerCase().includes(q))
    );
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "LOGIN":
        return LogIn;
      case "LOGOUT":
        return LogOut;
      case "TOKEN_REFRESHED":
        return RefreshCw;
      case "TOKEN_REUSE_DETECTED":
        return Flame;
      case "NEW_DEVICE":
        return Laptop;
      case "NEW_IP":
        return Globe2;
      case "TOKEN_REVOKED":
      case "SESSION_REVOKED":
        return Zap;
      default:
        return Activity;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Activity & IP Audit Logs"
        subtitle="Immutable security audit trail capturing authentication events and threat vectors"
        onRefresh={fetchEvents}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filter & Search Bar */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by event type, masked IP, metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Event Type Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              <span>Event:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                {severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <Card className="glass-panel overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Security Audit Stream ({filteredEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                    <th className="p-4 font-semibold">Event Type</th>
                    <th className="p-4 font-semibold">Severity</th>
                    <th className="p-4 font-semibold">Risk Delta</th>
                    <th className="p-4 font-semibold">Origin IP</th>
                    <th className="p-4 font-semibold">Context Metadata</th>
                    <th className="p-4 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                        Querying immutable security audit records...
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                        No audit events match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev) => {
                      const Icon = getEventIcon(ev.event_type);
                      return (
                        <tr key={ev.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-mono font-bold text-white text-xs">
                                {ev.event_type.replace(/_/g, " ")}
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <Badge variant="risk" riskLevel={ev.severity}>
                              {ev.severity}
                            </Badge>
                          </td>

                          <td className="p-4">
                            <span className="font-mono text-slate-300 font-semibold">
                              {ev.risk_score > 0 ? `+${ev.risk_score}` : "0"}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="font-mono text-slate-200">{maskIpAddress(ev.ip_address)}</span>
                          </td>

                          <td className="p-4">
                            <span className="text-slate-400 text-[11px] font-mono line-clamp-1 max-w-xs">
                              {ev.metadata ? JSON.stringify(ev.metadata) : "N/A"}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="text-slate-300 font-mono text-[11px]">
                              {new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </div>
                            <div className="text-slate-500 text-[10px]">
                              {formatRelativeTime(ev.created_at)}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
