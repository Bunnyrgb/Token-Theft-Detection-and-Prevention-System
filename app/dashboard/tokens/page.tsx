"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Ban,
  RefreshCw,
  Clock,
  Laptop,
  Globe2,
  Trash2,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";
import { maskTokenIdentifier, maskIpAddress, formatRelativeTime } from "@/lib/utils";

export default function TokensManagementPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Error fetching tokens:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleRevokeToken = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotification({ message: "Token and session revoked successfully", type: "success" });
        await fetchTokens();
      } else {
        const d = await res.json();
        setNotification({ message: d.error || "Failed to revoke token", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Network error revoking token", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualRotate = async () => {
    try {
      setActionLoading("rotate");
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        setNotification({ message: "Refresh token rotated and access token renewed", type: "success" });
        await fetchTokens();
      } else {
        const d = await res.json();
        setNotification({ message: d.error || "Rotation failed", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error during token rotation", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Token Management"
        subtitle="Cryptographic token fingerprints, rotation state, and revocation controls"
        onRefresh={fetchTokens}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Alerts / Feedback */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertOctagon className="h-4 w-4 text-rose-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Active Token Registry</h2>
              <p className="text-xs text-slate-400">
                Raw tokens are never exposed in plaintext. Obfuscated fingerprints guard against cross-scripting theft.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRotate}
              isLoading={actionLoading === "rotate"}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Rotate Current Refresh Token
            </Button>
          </div>
        </div>

        {/* Tokens Table */}
        <Card className="glass-panel overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Token Fingerprints ({sessions.length})</span>
              <span className="text-[11px] font-mono text-cyan-400">
                HS256 Access / SHA-256 Refresh Hash
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                    <th className="p-4 font-semibold">Token / Session ID</th>
                    <th className="p-4 font-semibold">Device & Client</th>
                    <th className="p-4 font-semibold">Network & Geo</th>
                    <th className="p-4 font-semibold">Timestamps</th>
                    <th className="p-4 font-semibold">Risk Index</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                        Querying cryptographic token records...
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                        No active tokens found.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => (
                      <tr
                        key={sess.id}
                        className={`hover:bg-slate-900/40 transition-colors ${
                          sess.is_current ? "bg-cyan-950/20" : ""
                        }`}
                      >
                        {/* Safe Masked Token Fingerprint */}
                        <td className="p-4">
                          <div className="font-mono font-bold text-white flex items-center gap-2">
                            <span>{sess.session_identifier}</span>
                            {sess.is_current && (
                              <span className="text-[10px] uppercase font-sans font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                This Session
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            UUID: {sess.id.slice(0, 8)}••••
                          </div>
                        </td>

                        {/* Device / Client */}
                        <td className="p-4">
                          <div className="text-slate-200 font-medium flex items-center gap-1.5">
                            <Laptop className="h-3.5 w-3.5 text-slate-400" />
                            <span>{sess.device?.device_name || "Unknown Device"}</span>
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {sess.device?.browser || "Browser"} • {sess.device?.operating_system || "OS"}
                          </div>
                        </td>

                        {/* IP & Location */}
                        <td className="p-4">
                          <div className="text-slate-200 font-mono">{maskIpAddress(sess.ip_address)}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Globe2 className="h-3 w-3 text-slate-500" />
                            <span>{sess.location || "Hyderabad, IN"}</span>
                          </div>
                        </td>

                        {/* Timestamps */}
                        <td className="p-4 space-y-0.5">
                          <div className="text-slate-300 text-[11px]">
                            <span className="text-slate-500">Active: </span>
                            {formatRelativeTime(sess.last_used_at)}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            <span>Expires: </span>
                            {new Date(sess.expires_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Risk Index */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="risk" riskLevel={sess.risk_level}>
                              {sess.risk_score} pts
                            </Badge>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              sess.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : sess.status === "Suspicious"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                sess.status === "Active"
                                  ? "bg-emerald-400"
                                  : sess.status === "Suspicious"
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }`}
                            />
                            {sess.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          {sess.status !== "Revoked" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRevokeToken(sess.id)}
                              isLoading={actionLoading === sess.id}
                              className="text-xs py-1 h-7"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
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
