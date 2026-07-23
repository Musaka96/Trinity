"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/utils";

export interface RevenuePoint {
  date: string;
  net: number;
}

export interface EventMarker {
  date: string;
  color: string;
  label: string;
}

export function RevenueChart({
  data,
  markers = [],
  height = 300,
}: {
  data: RevenuePoint[];
  markers?: EventMarker[];
  height?: number;
}) {
  const tickFmt = (d: string) => {
    const dt = new Date(d + "T00:00:00Z");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  };
  const byDate = new Map(data.map((d) => [d.date, d.net]));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={tickFmt}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            dy={8}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v, { compact: true })}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            content={({ active, label, payload }) => (
              <ChartTooltip
                active={active}
                label={label ? tickFmt(label as string) : undefined}
                entries={(payload ?? []).map((p) => ({
                  name: "Sales",
                  value: p.value as number,
                  color: "var(--series-1)",
                }))}
                formatValue={(n) => formatCurrency(n)}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#rev-fill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface-1)" }}
          />
          {markers.map((m) =>
            byDate.has(m.date) ? (
              <ReferenceDot
                key={m.date + m.label}
                x={m.date}
                y={byDate.get(m.date)!}
                r={5}
                fill={m.color}
                stroke="var(--surface-1)"
                strokeWidth={2}
              />
            ) : null,
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
