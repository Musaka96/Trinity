"use client";

import * as React from "react";

export interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

export function ChartTooltip({
  active,
  label,
  entries,
  formatValue,
}: {
  active?: boolean;
  label?: string;
  entries: TooltipEntry[];
  formatValue: (n: number) => string;
}) {
  if (!active || !entries.length) return null;
  return (
    <div className="min-w-[160px] rounded-xl border border-border-strong bg-surface-1/95 p-3 shadow-2xl backdrop-blur-md">
      {label && <p className="mb-2 text-xs font-medium text-muted">{label}</p>}
      <div className="flex flex-col gap-1.5">
        {entries.map((e) => (
          <div key={e.name} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-2 text-secondary">
              <span className="size-2 rounded-[3px]" style={{ background: e.color }} />
              {e.name}
            </span>
            <span className="tabular font-medium text-primary">{formatValue(e.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
