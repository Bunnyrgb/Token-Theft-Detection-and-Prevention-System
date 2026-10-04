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
  ListFilter,
  Calendar,
  Layers,
  AlertTriangle,
} from "lucide-react";

import { maskIpAddress, formatRelativeTime } from "@/lib/utils";
import { useTelemetryMode } from "@/lib/context/telemetry-mode-context";
import { EventDetailModal } from "@/components/dashboard/event-detail-modal";
import { SecurityEvent } from "@/lib/types";

const eventTypes = [
  "ALL",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "TOKEN_ISSUED",
  "TOKEN_ROTATED",
  "TOKEN_REPLAY_DETECTED",
  "TOKEN_REUSE_DETECTED",
  "DEVICE_CHANGED",
  "NEW_DEVICE",
  "IP_CHANGED",
  "NEW_IP",
  "IMPOSSIBLE_TRAVEL",
  "LOCATION_ANOMALY",
  "SUSPICIOUS_ACTIVITY",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
];

const severities = ["ALL", "INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function ActivityLogsPage() {
  const { mode, isSimulation } = useTelemetryMode();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("timeline");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = `/api/security/events?limit=100&mode=${mode}`;
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
  }, [selectedType, selectedSeverity, mode]);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.event_type.toLowerCase().includes(q) ||
      ev.ip_address.toLowerCase().includes(q) ||
      ev.severity.toLowerCase().includes(q) ||
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      (ev.action_taken && ev.action_taken.toLowerCase().includes(q))
    );
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case "LOGIN":
      case "LOGIN_SUCCESS":
        return LogIn;
      case "LOGIN_FAILED":
        return AlertTriangle;
      case "LOGOUT":
        return LogOut;
      case "TOKEN_ROTATED":
      case "TOKEN_REFRESHED":
        return RefreshCw;
      case "TOKEN_REPLAY_DETECTED":
      case "TOKEN_REUSE_DETECTED":
        return Flame;
      case "NEW_DEVICE":
      case "DEVICE_CHANGED":
        return Laptop;
      case "NEW_IP":
      case "IP_CHANGED":
        return Globe2;
      case "IMPOSSIBLE_TRAVEL":
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
        title="Security Audit Stream & Incident Timeline"
        subtitle="Chronological audit records tracking authentication telemetry, risk shifts, and automated actions"
        onRefresh={fetchEvents}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filter & View Switcher Bar */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by event, IP, action taken, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  viewMode === "timeline" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                Timeline View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  viewMode === "table" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                Table View
              </button>
            </div>

            {/* Event Filter */}
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

        {/* TIMELINE VIEW (Section 12 requirement) */}
        {viewMode === "timeline" && (
          <Card className="glass-panel overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                Security Incident Timeline ({filteredEvents.length} events)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="py-16 text-center text-slate-500 font-mono text-xs">
                  Loading security timeline from database...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-16 text-center text-slate-500 font-mono text-xs">
                  No security events recorded under current filter.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pl-6">
                  {filteredEvents.map((ev) => {
                    const Icon = getEventIcon(ev.event_type);
                    const isCrit = ev.severity === "CRITICAL";
                    const isHigh = ev.severity === "HIGH";

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="relative group cursor-pointer"
                      >
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 bg-[#060913] flex items-center justify-center transition-transform group-hover:scale-125 ${
                            isCrit
                              ? "border-rose-500 bg-rose-950"
                              : isHigh
                              ? "border-amber-500 bg-amber-950"
                              : "border-cyan-500 bg-cyan-950"
                          }`}
                        />

                        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 group-hover:border-cyan-500/50 group-hover:bg-slate-900/90 transition-all space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-cyan-400 font-bold">
                                {new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </span>
                              <span className="text-slate-600 font-mono">•</span>
                              <span className="text-sm font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                                {ev.event_type.replace(/_/g, " ")}
                              </span>
                              {ev.is_simulation && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  SIMULATION
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-300 font-semibold">
                                Risk: {ev.risk_score} pts
                              </span>
                              <Badge variant="risk" riskLevel={ev.severity}>
                                {ev.severity}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {ev.description || "Authentication telemetry event logged."}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                            <div className="flex items-center gap-2">
                              <span>Origin: {maskIpAddress(ev.ip_address)}</span>
                              {ev.location && <span>({ev.location})</span>}
                            </div>
                            <div className="text-emerald-400 font-medium">
                              Action: {ev.action_taken || "Logged to audit trail"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TABLE VIEW (Section 21 Audit Log) */}
        {viewMode === "table" && (
          <Card className="glass-panel overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                Security Audit Log Registry ({filteredEvents.length})
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
                      <th className="p-4 font-semibold">Action Taken</th>
                      <th className="p-4 font-semibold text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                          Querying security audit records...
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
                          <tr
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className="hover:bg-slate-900/50 transition-colors cursor-pointer group"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <div className="font-mono font-bold text-white text-xs group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                                    <span>{ev.event_type.replace(/_/g, " ")}</span>
                                    {ev.is_simulation && (
                                      <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        SIM
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs mt-0.5">
                                    {ev.description}
                                  </div>
                                </div>
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
                              <span className="text-emerald-400 font-mono text-[11px]">
                                {ev.action_taken || "Logged"}
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
        )}
      </main>

      {/* Interactive Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
