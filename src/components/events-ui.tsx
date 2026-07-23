"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { EVENT_META, TrinityEvent } from "@/lib/events";

export function EventChip({ ev }: { ev: TrinityEvent }) {
  const meta = EVENT_META[ev.type];
  return (
    <Badge variant={meta.badge} title={ev.note || ev.title}>
      <span>{meta.emoji}</span>
      {ev.title}
    </Badge>
  );
}

function fmtRange(ev: TrinityEvent) {
  const f = (d: string) =>
    new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return ev.endDate && ev.endDate !== ev.date ? `${f(ev.date)} – ${f(ev.endDate)}` : f(ev.date);
}

export function EventList({
  events,
  emptyLabel = "No events.",
  scopeName,
}: {
  events: TrinityEvent[];
  emptyLabel?: string;
  scopeName?: (ev: TrinityEvent) => string | null;
}) {
  if (events.length === 0) {
    return <p className="px-2 py-6 text-center text-sm text-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {events.map((ev) => {
        const meta = EVENT_META[ev.type];
        const scope = scopeName?.(ev);
        return (
          <li
            key={ev.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-2/40 p-3"
          >
            <span
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-base"
              style={{ background: "var(--surface-3)" }}
            >
              {meta.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-primary">{ev.title}</p>
                <Badge variant={meta.badge}>{meta.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {fmtRange(ev)}
                {scope ? ` · ${scope}` : ""}
              </p>
              {ev.note && <p className="mt-1 text-xs text-secondary">{ev.note}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
