"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Laptop,
  Smartphone,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Fingerprint,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (e) {
      console.error("Error fetching devices:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleToggleTrust = async (deviceId: string, currentTrust: boolean) => {
    try {
      setActionLoading(deviceId);
      const endpoint = currentTrust ? `/api/devices/${deviceId}/untrust` : `/api/devices/${deviceId}/trust`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        setNotification({
          message: `Device marked as ${!currentTrust ? "Trusted" : "Untrusted"}`,
          type: "success",
        });
        await fetchDevices();
      }
    } catch (e) {
      setNotification({ message: "Failed to update device trust status", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile":
        return Smartphone;
      case "tablet":
        return Tablet;
      case "desktop":
      default:
        return Laptop;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Device Fingerprinting"
        subtitle="Privacy-preserving device recognition and trust authorization management"
        onRefresh={fetchDevices}
      />

      <main className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Notification */}
        {notification && (
          <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Info Banner & Limitations Notice */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Cryptographic Device Registry</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                TokenGuard generates deterministic SHA-256 hashes of client headers, browser architectures, and operating system properties. Unrecognized devices automatically trigger elevated risk levels and operator alerts.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Technical Limitations:</strong> Device fingerprints are privacy-preserving heuristics based on browser and operating system telemetry. They do not constitute guaranteed, tamper-proof hardware identifiers. Browser updates, private browsing windows, or anti-fingerprinting extensions can alter these signals.
          </div>
        </div>


        {/* Device Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-mono text-xs">
              Loading paired device telemetry...
            </div>
          ) : devices.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-mono text-xs">
              No devices registered yet.
            </div>
          ) : (
            devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.device_type);
              return (
                <Card
                  key={device.id}
                  className={`glass-panel-hover flex flex-col justify-between border ${
                    device.trusted ? "border-emerald-500/30 bg-[#0c1626]/80" : "border-slate-800"
                  }`}
                >
                  <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-lg border ${
                            device.trusted
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}
                        >
                          <DeviceIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{device.device_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {device.browser} • {device.operating_system}
                          </div>
                        </div>
                      </div>

                      {device.trusted ? (
                        <Badge variant="success" className="text-[10px] uppercase font-bold">
                          Trusted
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                          Untrusted
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-2.5 flex-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Device Hash:</span>
                      <span className="font-mono text-cyan-300 text-[11px]">{device.device_identifier}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Device Class:</span>
                      <span className="text-slate-200">{device.device_type}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">First Seen:</span>
                      <span className="text-slate-300 font-mono">{formatRelativeTime(device.first_seen_at)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Last Seen:</span>
                      <span className="text-slate-300 font-mono">{formatRelativeTime(device.last_seen_at)}</span>
                    </div>
                  </CardContent>

                  <div className="p-5 pt-0">
                    <Button
                      variant={device.trusted ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleToggleTrust(device.id, device.trusted)}
                      isLoading={actionLoading === device.id}
                      className="w-full text-xs"
                    >
                      {device.trusted ? (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                          Revoke Device Trust
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                          Mark Device as Trusted
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
