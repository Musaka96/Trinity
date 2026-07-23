"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/utils";

export interface StackedPoint {
  date: string;
  morning: number;
  afternoon: number;
  night: number;
}

const SERIES = [
  { key: "morning", label: "Morning", color: "var(--series-4)" },
  { key: "afternoon", label: "Afternoon", color: "var(--series-1)" },
  { key: "night", label: "Night", color: "var(--series-7)" },
] as const;

export function StackedShiftChart({ data }: { data: StackedPoint[] }) {
  const tickFmt = (d: string) =>
    new Date(d + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 px-2">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2 text-xs text-secondary">
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`stk-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFmt}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
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
                  entries={SERIES.map((s) => ({
                    name: s.label,
                    value: (payload?.find((p) => p.dataKey === s.key)?.value as number) ?? 0,
                    color: s.color,
                  }))}
                  formatValue={(n) => formatCurrency(n)}
                />
              )}
            />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stackId="1"
                stroke={s.color}
                strokeWidth={1.5}
                fill={`url(#stk-${s.key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
