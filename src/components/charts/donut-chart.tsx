"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/utils";

export interface DonutSlice {
  label: string;
  value: number;
}

const PALETTE = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

export function DonutChart({ data }: { data: DonutSlice[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="var(--surface-1)"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={d.label} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  entries={(payload ?? []).map((p) => ({
                    name: p.name as string,
                    value: p.value as number,
                    color: PALETTE[data.findIndex((d) => d.label === p.name) % PALETTE.length],
                  }))}
                  formatValue={(n) => formatCurrency(n)}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted">Total</span>
          <span className="text-lg font-semibold tabular">{formatCurrency(total, { compact: true })}</span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-secondary">
              <span className="size-2.5 rounded-[3px]" style={{ background: PALETTE[i % PALETTE.length] }} />
              {d.label}
            </span>
            <span className="tabular font-medium">
              {total ? ((d.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
