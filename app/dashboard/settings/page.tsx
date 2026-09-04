"use client";

import React, { useState, useEffect } from "react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  User,
  Lock,
  Shield,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Clock,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>({ name: "", email: "", created_at: "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [sensitivity, setSensitivity] = useState("HIGH");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (newPassword !== confirmPassword) {
      setNotification({ message: "New passwords do not match", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setNotification({ message: "Password must be at least 8 characters", type: "error" });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({ message: "Password updated successfully", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setNotification({ message: data.error || "Failed to update password", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error changing password", type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeAll = async () => {
    try {
      setRevokeLoading(true);
      const res = await fetch("/api/sessions/revoke-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotification({ message: data.message || "All other sessions revoked", type: "success" });
      } else {
        setNotification({ message: data.error || "Revocation failed", type: "error" });
      }
    } catch (e) {
      setNotification({ message: "Error revoking sessions", type: "error" });
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardTopbar
        title="Account & Security Settings"
        subtitle="Manage credentials, session timeouts, and risk detection engine sensitivity"
      />

      <main className="p-6 space-y-6 max-w-4xl w-full mx-auto">
        {/* Notification */}
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

        {/* Account Profile Card */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              Operator Account Details
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Primary identification credentials for this TokenGuard deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-semibold">Operator Name</label>
                <div className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-medium">
                  {user.name || "Loading..."}
                </div>
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Email Address</label>
                <div className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-medium">
                  {user.email || "Loading..."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" />
              Update Master Password
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Hashed with Argon2/bcrypt with high iteration cost factors.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Current Password</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">New Password</label>
                  <Input
                    type="password"
                    placeholder="Min 8 chars"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={passwordLoading}>
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Session Security & Policy */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              Session Security Policy & Invalidation
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Adjust engine sensitivity and initiate zero-trust global revocation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="font-semibold text-white">Risk Engine Sensitivity</div>
                <div className="text-slate-400 text-[11px]">
                  Configures risk threshold multipliers for new IP and device events
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(["STANDARD", "HIGH", "PARANOID"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSensitivity(lvl)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all border ${
                      sensitivity === lvl
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <div>
                <div className="font-semibold text-rose-300">Global Session Invalidation</div>
                <div className="text-slate-400 text-[11px]">
                  Terminate all other active sessions and refresh tokens across all enrolled devices.
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRevokeAll}
                isLoading={revokeLoading}
                className="text-xs whitespace-nowrap"
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Revoke All Other Sessions
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
