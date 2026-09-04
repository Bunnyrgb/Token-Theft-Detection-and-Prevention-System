import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a raw session/token ID into a safe obfuscated SOC fingerprint
 * Example: 'sess_8f42••••91ac'
 */
export function maskTokenIdentifier(id: string): string {
  if (!id) return "sess_••••••••";
  const clean = id.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length <= 8) {
    return `sess_${clean.slice(0, 4)}••••`;
  }
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `sess_${prefix}••••${suffix}`;
}

/**
 * Masks sensitive IP address for display
 * Example: '192.168.1.45' -> '192.168.xxx.45'
 */
export function maskIpAddress(ip: string): string {
  if (!ip) return "Unknown IP";
  if (ip === "127.0.0.1" || ip === "::1") return "127.0.0.1 (Localhost)";
  
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.${parts[3]}`;
  }
  // IPv6
  const v6Parts = ip.split(":");
  if (v6Parts.length > 2) {
    return `${v6Parts[0]}:${v6Parts[1]}:••••:${v6Parts[v6Parts.length - 1]}`;
  }
  return ip;
}

/**
 * Format relative time (e.g. '2 minutes ago', 'Just now')
 */
export function formatRelativeTime(dateString: string | Date): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
}

/**
 * Risk badge styling configuration
 */
export function getRiskBadgeClasses(level: string): { bg: string; text: string; border: string; glow: string } {
  switch (level?.toUpperCase()) {
    case "CRITICAL":
      return {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/30",
        glow: "shadow-[0_0_12px_rgba(244,63,94,0.3)]",
      };
    case "HIGH":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
      };
    case "MEDIUM":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
        glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]",
      };
    case "LOW":
    default:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
      };
  }
}
