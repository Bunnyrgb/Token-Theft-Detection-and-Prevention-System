"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Activity,
  KeyRound,
  Laptop,
  Radio,
  BellRing,
  BarChart3,
  FlaskConical,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Overview", href: "/dashboard", icon: Shield },
  { name: "Tokens", href: "/dashboard/tokens", icon: KeyRound },
  { name: "Sessions", href: "/dashboard/sessions", icon: Radio },
  { name: "Devices", href: "/dashboard/devices", icon: Laptop },
  { name: "Activity Logs", href: "/dashboard/activity", icon: Activity },
  { name: "Security Alerts", href: "/dashboard/alerts", icon: BellRing },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Threat Simulator", href: "/dashboard/simulator", icon: FlaskConical, badge: "Lab" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ user, unreadAlerts = 0 }: { user?: { name: string; email: string }; unreadAlerts?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      router.push("/login");
    }
  };

  return (
    <aside className="w-64 bg-[#080d1a] border-r border-slate-800/80 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all">
            <Shield className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
              <span>Token</span>
              <span className="text-cyan-400">Guard</span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-semibold">
              SOC Security Suite
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Security Console
        </div>

        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-400"
                  )}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  {item.badge}
                </span>
              )}

              {item.name === "Security Alerts" && unreadAlerts > 0 && (
                <span className="h-5 px-1.5 min-w-[20px] rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center justify-center animate-pulse">
                  {unreadAlerts}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-[#060a14]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 uppercase">
              {user?.name ? user.name.slice(0, 2) : "TG"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Security Operator"}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email || "soc@tokenguard.io"}</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md border border-rose-500/20 transition-all font-medium"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Disconnect Session</span>
        </button>
      </div>
    </aside>
  );
}
