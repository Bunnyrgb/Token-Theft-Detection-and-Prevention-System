"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const LEVEL_COLORS: Record<string, string> = {
  LOW: "#10b981",      // Emerald
  MEDIUM: "#00f0ff",   // Cyan
  HIGH: "#f59e0b",     // Amber
  CRITICAL: "#f43f5e", // Rose
};

export function RiskDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  const filtered = (data || []).filter((d) => d.value > 0);

  if (filtered.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-slate-500 font-mono text-xs">
        No risk distribution telemetry available.
      </div>
    );
  }

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {filtered.map((entry) => (
              <Cell
                key={entry.name}
                fill={LEVEL_COLORS[entry.name] || "#64748b"}
                stroke="#0b1120"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0d1322",
              borderColor: "rgba(0, 240, 255, 0.3)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(value: any) => [`${value} events`, "Frequency"]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
