"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Laptop,
  Globe2,
  Clock,
  Shield,
  Ban,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Lock,
} from "lucide-react";
import { maskTokenIdentifier, maskIpAddress, formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function SessionsManagementPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "single" | "all";
    session?: any;
  } | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sess: any) => {
    try {
      setActionLoading(sess.id);
      const res = await fetch(`/api/sessions/${sess.id}`, { method: "DELETE" });
      if (res.ok) {
        setNotification({ message: "Session revoked successfully", type: "success" });
        if (selectedSession?.id === sess.id) setSelectedSession(null);
        setConfirmModal(null);
        await fetchSessions();
        if (sess.is_current) {
          router.push("/login");
        }
      } else {
        const d = await res.json();
        setNotification({ message: d.error || "Failed to revoke session", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error revoking session", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSession = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/sessions/${id}/reactivate`, { method: "POST" });
      if (res.ok) {
        setNotification({ message: "Session reactivated successfully", type: "success" });
        await fetchSessions();
      } else {
        const d = await res.json();
        setNotification({ message: d.error || "Failed to reactivate session", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error reactivating session", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      setActionLoading("revoke-all");
      const res = await fetch("/api/sessions/revoke-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotification({ message: data.message || "Revoked all other sessions", type: "success" });
        setConfirmModal(null);
        await fetchSessions();
      } else {
        setNotification({ message: data.error || "Failed to revoke sessions", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error during mass session revocation", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "Active");
  const otherActiveSessionsCount = activeSessions.filter((s) => !s.is_current).length;

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Session Management"
        subtitle="Manage active authorization streams, review telemetry, and isolate compromised sessions"
        onRefresh={fetchSessions}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Notification Banner */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Global Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Active Sessions & Streams</h2>
              <p className="text-xs text-slate-400">
                You have {activeSessions.length} active session{activeSessions.length === 1 ? "" : "s"} across verified client endpoints.
              </p>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmModal({ type: "all" })}
            disabled={otherActiveSessionsCount === 0}
            className="w-full sm:w-auto text-xs"
          >
            <Ban className="h-3.5 w-3.5 mr-1" />
            Revoke All Other Sessions ({otherActiveSessionsCount})
          </Button>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-mono text-xs">
              Loading active session telemetry...
            </div>
          ) : sessions.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-mono text-xs">
              No sessions found.
            </div>
          ) : (
            sessions.map((sess) => (
              <Card
                key={sess.id}
                className={`glass-panel-hover flex flex-col justify-between border ${
                  sess.is_current
                    ? "border-cyan-500/40 bg-[#0c1426]/90 shadow-[0_0_20px_rgba(0,240,255,0.12)]"
                    : sess.status === "Revoked"
                    ? "border-rose-500/20 opacity-60 bg-[#090d18]"
                    : "border-slate-800"
                }`}
              >
                <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{sess.device?.browser || "Browser"}</span>
                          <span className="text-slate-400 text-xs font-normal">on {sess.device?.operating_system || "OS"}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Globe2 className="h-3 w-3 text-slate-500" />
                          <span>{sess.location || "Hyderabad, IN"}</span>
                        </div>
                      </div>
                    </div>

                    {sess.is_current && (
                      <Badge variant="default" className="text-[10px] font-bold uppercase font-mono">
                        Current Session
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-3 flex-1">
                  {/* Fingerprint identifier */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Identifier:</span>
                    <span className="font-mono text-slate-200">{sess.session_identifier}</span>
                  </div>

                  {/* IP Address */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">IP Address:</span>
                    <span className="font-mono text-slate-200">{maskIpAddress(sess.ip_address)}</span>
                  </div>

                  {/* Token Status & Rotation Count */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Token Status:</span>
                    <span className="font-mono text-cyan-300">
                      Rotated {sess.rotation_count || 0} time{(sess.rotation_count || 0) === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Created timestamp */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-slate-300">{formatRelativeTime(sess.created_at)}</span>
                  </div>

                  {/* Last Active */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Last active:</span>
                    <span className="text-slate-300 font-medium">{formatRelativeTime(sess.last_used_at)}</span>
                  </div>

                  {/* Risk Level */}
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">Status & Risk:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          sess.status === "Active"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : sess.status === "Suspicious"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {sess.status}
                      </span>
                      <Badge variant="risk" riskLevel={sess.risk_level}>
                        {sess.risk_score} pts
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(sess)}
                    className="flex-1 text-xs"
                  >
                    <Info className="h-3.5 w-3.5 mr-1" />
                    Details
                  </Button>

                  {sess.status !== "Revoked" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmModal({ type: "single", session: sess })}
                      className="text-xs"
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleReactivateSession(sess.id)}
                      isLoading={actionLoading === sess.id}
                      className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Reactivate
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Confirmation Modal for Destructive Actions (Section 11 requirement) */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0e1424] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(244,63,94,0.25)] space-y-4">
              <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold text-white font-mono">
                  {confirmModal.type === "all" ? "Confirm Mass Session Revocation" : "Confirm Session Revocation"}
                </h3>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                {confirmModal.type === "all" ? (
                  <p>
                    Are you sure you want to revoke <strong>all {otherActiveSessionsCount} other active sessions</strong>? Active connections on other laptops, phones, and devices will be immediately disconnected.
                  </p>
                ) : (
                  <p>
                    Are you sure you want to revoke session <strong>{confirmModal.session?.session_identifier}</strong>?
                    {confirmModal.session?.is_current && (
                      <span className="block text-rose-300 font-bold mt-1">
                        ⚠️ WARNING: This is your CURRENT session. Revoking it will log you out immediately.
                      </span>
                    )}
                  </p>
                )}
                <p className="text-slate-500 text-[11px]">
                  All associated refresh tokens and access tokens for this session will be permanently invalidated.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmModal(null)}
                  disabled={!!actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  isLoading={!!actionLoading}
                  onClick={() => {
                    if (confirmModal.type === "all") {
                      handleRevokeAllOthers();
                    } else if (confirmModal.session) {
                      handleRevokeSession(confirmModal.session);
                    }
                  }}
                >
                  Confirm Revocation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Session Detail Modal */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0c1222] border border-cyan-500/30 rounded-xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Session Telemetry Inspection</h3>
                </div>
                <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-white font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono">
                  <div className="text-slate-400">SESSION IDENTIFIER:</div>
                  <div className="text-cyan-300 font-bold">{selectedSession.session_identifier}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500">Device Name:</span> {selectedSession.device?.device_name || "Unknown"}
                  </div>
                  <div>
                    <span className="text-slate-500">Operating System:</span> {selectedSession.device?.operating_system || "Unknown"}
                  </div>
                  <div>
                    <span className="text-slate-500">Browser Engine:</span> {selectedSession.device?.browser || "Unknown"}
                  </div>
                  <div>
                    <span className="text-slate-500">Device Type:</span> {selectedSession.device?.device_type || "Desktop"}
                  </div>
                  <div>
                    <span className="text-slate-500">Rotation Count:</span> {selectedSession.rotation_count || 0} cycles
                  </div>
                  <div>
                    <span className="text-slate-500">Network IP:</span> {maskIpAddress(selectedSession.ip_address)}
                  </div>
                  <div>
                    <span className="text-slate-500">Approx Location:</span> {selectedSession.location}
                  </div>
                  <div>
                    <span className="text-slate-500">Expires:</span> {new Date(selectedSession.expires_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-slate-400 font-mono text-[11px]">USER-AGENT STRING:</div>
                  <div className="text-slate-300 break-all font-mono text-[11px]">
                    {selectedSession.user_agent}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
                {selectedSession.status !== "Revoked" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedSession(null);
                      setConfirmModal({ type: "single", session: selectedSession });
                    }}
                  >
                    Revoke Session
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
