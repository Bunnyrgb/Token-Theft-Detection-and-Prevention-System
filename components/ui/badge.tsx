import React from "react";
import { cn, getRiskBadgeClasses } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "risk" | "success" | "warning" | "danger";
  riskLevel?: string;
}

export function Badge({ className, variant = "default", riskLevel, children, ...props }: BadgeProps) {
  if (variant === "risk" && riskLevel) {
    const riskStyle = getRiskBadgeClasses(riskLevel);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border",
          riskStyle.bg,
          riskStyle.text,
          riskStyle.border,
          className
        )}
        {...props}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", riskStyle.text.replace("text-", "bg-"))} />
        {children || riskLevel}
      </span>
    );
  }

  const variants = {
    default: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
    secondary: "bg-slate-800 text-slate-300 border border-slate-700",
    outline: "border border-slate-700 text-slate-400",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    risk: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
