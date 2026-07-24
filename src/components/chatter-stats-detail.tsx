"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatRow } from "@/lib/types";
import {
  Totals,
  avgCharsPerMessage,
  avgPerFan,
  avgPerUnlock,
  fanCVR,
  goldenRatio,
  sumTotals,
  unlockRate,
} from "@/lib/analytics";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";

/**
 * Every metric the infloww export carries, for one chatter, honouring the
 * global date range plus an optional per-model filter.
 */

type Fmt = "money" | "int" | "pct" | "money2";

interface Metric {
  label: string;
  value: (t: Totals) => number;
  fmt: Fmt;
  hint?: string;
}

const GROUPS: { title: string; metrics: Metric[] }[] = [
  {
    title: "Revenue",
    metrics: [
      { label: "Sales", value: (t) => t.sales, fmt: "money2", hint: "PPV sales + tips" },
      { label: "PPV sales", value: (t) => t.ppvSales, fmt: "money2" },
      { label: "Tips", value: (t) => t.tips, fmt: "money2" },
      { label: "Direct message sales", value: (t) => t.dmSales, fmt: "money2" },
      { label: "Priority mass message sales", value: (t) => t.priorityMassSales, fmt: "money2" },
      { label: "OF mass message sales", value: (t) => t.ofMassSales, fmt: "money2" },
    ],
  },
  {
    title: "PPV performance",
    metrics: [
      { label: "Direct PPVs sent", value: (t) => t.ppvsSent, fmt: "int" },
      { label: "PPVs unlocked", value: (t) => t.ppvsUnlocked, fmt: "int" },
      { label: "Unlock rate", value: unlockRate, fmt: "pct", hint: "Unlocked ÷ sent" },
      { label: "Golden ratio", value: goldenRatio, fmt: "pct", hint: "PPVs sent ÷ messages sent" },
      { label: "Avg per unlock", value: avgPerUnlock, fmt: "money2" },
    ],
  },
  {
    title: "Messaging",
    metrics: [
      { label: "Direct messages sent", value: (t) => t.dmsSent, fmt: "int" },
      { label: "Character count", value: (t) => t.charCount, fmt: "int" },
      { label: "Avg characters / message", value: avgCharsPerMessage, fmt: "int" },
    ],
  },
  {
    title: "Fans",
    metrics: [
      { label: "Fans chatted", value: (t) => t.fansChatted, fmt: "int", hint: "Summed per model/day" },
      { label: "Fans who spent money", value: (t) => t.fansWhoSpent, fmt: "int", hint: "Summed per model/day" },
      { label: "Fan CVR", value: fanCVR, fmt: "pct", hint: "Spenders ÷ fans chatted" },
      { label: "Avg earnings per paying fan", value: avgPerFan, fmt: "money2" },
    ],
  },
];

function fmt(v: number, kind: Fmt): string {
  if (kind === "money") return formatCurrency(v);
  if (kind === "money2")
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
  if (kind === "pct") return `${v.toFixed(2)}%`;
  return formatNumber(Math.round(v));
}

export function ChatterStatsDetail({ rows }: { rows: StatRow[] }) {
  const models = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.creator))).sort(),
    [rows],
  );
  const [model, setModel] = React.useState<string>("all");

  // Reset the filter if the selected model leaves the current date range.
  React.useEffect(() => {
    if (model !== "all" && !models.includes(model)) setModel("all");
  }, [models, model]);

  const filtered = model === "all" ? rows : rows.filter((r) => r.creator === model);
  const totals = sumTotals(filtered);

  const byDay = React.useMemo(() => {
    const map = new Map<string, StatRow[]>();
    for (const r of filtered) {
      const arr = map.get(r.date) ?? [];
      arr.push(r);
      map.set(r.date, arr);
    }
    return Array.from(map.entries())
      .map(([date, rs]) => ({ date, t: sumTotals(rs) }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Detailed stats</CardTitle>
          <CardDescription>
            Every metric from the infloww export, for the selected dates
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{filtered.length} rows</Badge>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-9 rounded-lg border border-border bg-surface-2 px-3 text-sm text-primary focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
          >
            <option value="all">All models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No data for this selection.</p>
        )}

        {filtered.length > 0 && (
          <>
            {GROUPS.map((g) => (
              <div key={g.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {g.metrics.map((m) => (
                    <div key={m.label} className="rounded-lg border border-border bg-surface-2/40 p-3">
                      <p className="text-xs text-muted">{m.label}</p>
                      <p className="mt-1 text-lg font-semibold tabular text-primary">
                        {fmt(m.value(totals), m.fmt)}
                      </p>
                      {m.hint && <p className="mt-0.5 text-[11px] text-muted">{m.hint}</p>}
                    </div>
                  ))}
                </div>
                {g.title === "Fans" && (
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    Fan counts are summed per model and day, so a fan who talks to two models — or on two
                    days — is counted each time. Money and message metrics are exact.
                  </p>
                )}
              </div>
            ))}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Day by day</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/50 text-left text-xs text-muted">
                      <th className="px-3 py-2.5 font-medium">Date</th>
                      <th className="px-3 py-2.5 text-right font-medium">Sales</th>
                      <th className="px-3 py-2.5 text-right font-medium">PPV</th>
                      <th className="px-3 py-2.5 text-right font-medium">Tips</th>
                      <th className="px-3 py-2.5 text-right font-medium">Msgs</th>
                      <th className="px-3 py-2.5 text-right font-medium">PPVs sent</th>
                      <th className="px-3 py-2.5 text-right font-medium">Unlocked</th>
                      <th className="px-3 py-2.5 text-right font-medium">Unlock %</th>
                      <th className="px-3 py-2.5 text-right font-medium">Fans</th>
                      <th className="px-3 py-2.5 text-right font-medium">Spenders</th>
                      <th className="px-3 py-2.5 text-right font-medium">CVR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDay.map((d, i) => (
                      <tr key={d.date} className={cn(i % 2 === 1 && "bg-surface-1")}>
                        <td className="whitespace-nowrap px-3 py-2.5 text-secondary">{formatDate(d.date)}</td>
                        <td className="px-3 py-2.5 text-right font-medium tabular text-primary">
                          {formatCurrency(d.t.sales)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{formatCurrency(d.t.ppvSales)}</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{formatCurrency(d.t.tips)}</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(d.t.dmsSent)}</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(d.t.ppvsSent)}</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(d.t.ppvsUnlocked)}</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{unlockRate(d.t).toFixed(1)}%</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(d.t.fansChatted)}</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(d.t.fansWhoSpent)}</td>
                        <td className="px-3 py-2.5 text-right tabular text-secondary">{fanCVR(d.t).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border-strong bg-surface-2/50 font-medium">
                      <td className="px-3 py-2.5 text-secondary">Total</td>
                      <td className="px-3 py-2.5 text-right tabular text-primary">{formatCurrency(totals.sales)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{formatCurrency(totals.ppvSales)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{formatCurrency(totals.tips)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(totals.dmsSent)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(totals.ppvsSent)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(totals.ppvsUnlocked)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{unlockRate(totals).toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(totals.fansChatted)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{formatNumber(totals.fansWhoSpent)}</td>
                      <td className="px-3 py-2.5 text-right tabular text-secondary">{fanCVR(totals).toFixed(1)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
