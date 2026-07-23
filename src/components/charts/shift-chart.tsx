"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/utils";

const SHIFT_COLORS: Record<string, string> = {
  Morning: "var(--series-4)",
  Afternoon: "var(--series-1)",
  Night: "var(--series-7)",
  "Full day": "var(--series-1)",
};

export function ShiftChart({ data }: { data: { shift: string; net: number }[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="shift"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v, { compact: true })}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)", opacity: 0.5 }}
            content={({ active, payload }) => (
              <ChartTooltip
                active={active}
                label={payload?.[0]?.payload?.shift}
                entries={(payload ?? []).map((p) => ({
                  name: "Net revenue",
                  value: p.value as number,
                  color: SHIFT_COLORS[p.payload.shift] ?? "var(--series-1)",
                }))}
                formatValue={(n) => formatCurrency(n)}
              />
            )}
          />
          <Bar dataKey="net" radius={[6, 6, 0, 0]} maxBarSize={72}>
            {data.map((d) => (
              <Cell key={d.shift} fill={SHIFT_COLORS[d.shift] ?? "var(--series-1)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
