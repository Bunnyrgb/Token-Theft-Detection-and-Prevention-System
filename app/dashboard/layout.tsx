import React from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getAuthCookiesFromHeaders } from "@/lib/auth/cookies";
import { sessionManager } from "@/lib/auth/session-manager";
import { dbRepository } from "@/lib/database";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken } = getAuthCookiesFromHeaders();

  let user = { name: "Security Operator", email: "operator@tokenguard.io" };
  let unreadAlerts = 0;

  if (accessToken) {
    const authResult = await sessionManager.validateRequestSession(accessToken);
    if (!authResult.valid || !authResult.user) {
      redirect("/login");
    }
    user = { name: authResult.user.name, email: authResult.user.email };
    const alerts = await dbRepository.getAlertsByUser(authResult.user.id);
    unreadAlerts = alerts.filter((a) => !a.read).length;
  } else {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#060913] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <DashboardSidebar user={user} unreadAlerts={unreadAlerts} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
