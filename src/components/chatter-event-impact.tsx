"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EVENT_META, TrinityEvent } from "@/lib/events";
import { eventImpact } from "@/lib/analytics";
import { cn, formatCurrency, formatDate, formatPct } from "@/lib/utils";

/**
 * Lists the events touching a chatter, each with the sales difference during
 * the event window vs the chatter's normal daily average.
 */
export function ChatterEventImpact({
  events,
  daily,
  scopeName,
}: {
  events: TrinityEvent[];
  daily: { date: string; net: number }[];
  scopeName?: (ev: TrinityEvent) => string | null;
}) {
  if (events.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-muted">
        No events affecting this chatter. Add promotions, takeovers, holidays and more on the Events page.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((ev) => {
        const meta = EVENT_META[ev.type];
        const to = ev.endDate && ev.endDate >= ev.date ? ev.endDate : ev.date;
        const impact = eventImpact(daily, ev.date, to);
        const up = impact.deltaPct >= 0;
        const scope = scopeName?.(ev);

        return (
          <li key={ev.id} className="rounded-lg border border-border bg-surface-2/40 p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-base">
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-primary">{ev.title}</p>
                  <Badge variant={meta.badge}>{meta.label}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {ev.endDate && ev.endDate !== ev.date
                    ? `${formatDate(ev.date)} – ${formatDate(ev.endDate)}`
                    : formatDate(ev.date)}
                  {scope ? ` · ${scope}` : ""}
                </p>
                {ev.note && <p className="mt-1 text-xs text-secondary">{ev.note}</p>}
              </div>

              {impact.duringDays > 0 && impact.hasBaseline && (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    up ? "bg-[var(--good-soft)] text-good" : "bg-[var(--critical-soft)] text-critical",
                  )}
                  title="Sales vs the chatter's normal daily average"
                >
                  {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {formatPct(impact.deltaPct)}
                </span>
              )}
            </div>

            {impact.duringDays > 0 ? (
              <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-border pt-2.5 text-center">
                <Metric label="During event" value={formatCurrency(impact.duringTotal)} />
                <Metric
                  label={`Avg / day (${impact.duringDays}d)`}
                  value={formatCurrency(impact.duringAvg, { compact: true })}
                />
                <Metric
                  label="Normal / day"
                  value={impact.hasBaseline ? formatCurrency(impact.baselineDaily, { compact: true }) : "—"}
                />
              </div>
            ) : (
              <p className="mt-2 border-t border-border pt-2 text-xs text-muted">
                No sales recorded for this chatter during the event window.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold tabular text-primary">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
