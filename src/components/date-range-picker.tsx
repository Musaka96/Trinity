"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useData, DateRange } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";

const DAY = 86400000;
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(s + "T00:00:00Z");
const addDaysISO = (s: string, n: number) => toISO(new Date(parse(s).getTime() + n * DAY));
const clampISO = (s: string, min: string, max: string) => (s < min ? min : s > max ? max : s);

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function monthMatrix(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const startDow = first.getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(toISO(new Date(Date.UTC(year, month, d))));
  while (cells.length % 7) cells.push(null);
  return cells;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void) {
  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onOut]);
}

export function DateRangePicker() {
  const { range, bounds, setRange } = useData();
  const [open, setOpen] = React.useState(false);
  const [pendingStart, setPendingStart] = React.useState<string | null>(null);
  const [view, setView] = React.useState<{ y: number; m: number } | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => setOpen(false));

  const effective = range ?? bounds;

  const openPopover = () => {
    if (!bounds) return;
    const anchor = parse(effective?.to ?? bounds.to);
    setView({ y: anchor.getUTCFullYear(), m: anchor.getUTCMonth() });
    setPendingStart(null);
    setOpen((o) => !o);
  };

  if (!bounds) {
    return (
      <button
        disabled
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm text-muted"
      >
        <CalendarDays className="size-4" /> No data
      </button>
    );
  }

  const label =
    range === null
      ? "All dates"
      : range.from === range.to
        ? formatDate(range.from)
        : `${formatDate(range.from)} – ${formatDate(range.to)}`;

  const presets: { label: string; range: DateRange | null }[] = [
    { label: "All dates", range: null },
    { label: "Last 7 days", range: { from: clampISO(addDaysISO(bounds.to, -6), bounds.from, bounds.to), to: bounds.to } },
    { label: "Last 14 days", range: { from: clampISO(addDaysISO(bounds.to, -13), bounds.from, bounds.to), to: bounds.to } },
    { label: "Last 30 days", range: { from: clampISO(addDaysISO(bounds.to, -29), bounds.from, bounds.to), to: bounds.to } },
    {
      label: "This month",
      range: {
        from: clampISO(bounds.to.slice(0, 8) + "01", bounds.from, bounds.to),
        to: bounds.to,
      },
    },
  ];

  const sameRange = (a: DateRange | null, b: DateRange | null) =>
    (a === null && b === null) || (!!a && !!b && a.from === b.from && a.to === b.to);

  const onDay = (iso: string) => {
    if (!pendingStart) {
      setPendingStart(iso);
      return;
    }
    const [from, to] = iso < pendingStart ? [iso, pendingStart] : [pendingStart, iso];
    setRange({ from, to });
    setPendingStart(null);
    setOpen(false);
  };

  const cells = view ? monthMatrix(view.y, view.m) : [];
  const monthLabel = view
    ? new Date(Date.UTC(view.y, view.m, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    : "";

  const canPrev = view ? toISO(new Date(Date.UTC(view.y, view.m, 1))) > bounds.from : false;
  const canNext = view ? toISO(new Date(Date.UTC(view.y, view.m + 1, 1))) <= bounds.to : false;

  const shiftMonth = (delta: number) =>
    setView((v) => (v ? { y: new Date(Date.UTC(v.y, v.m + delta, 1)).getUTCFullYear(), m: new Date(Date.UTC(v.y, v.m + delta, 1)).getUTCMonth() } : v));

  const highlightFrom = pendingStart ?? effective?.from;
  const highlightTo = pendingStart ?? effective?.to;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={openPopover}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
          open ? "border-border-strong bg-surface-2 text-primary" : "border-border bg-surface-2 text-secondary hover:text-primary",
        )}
      >
        <CalendarDays className="size-4 text-accent" />
        <span className="tabular">{label}</span>
      </button>

      {open && view && (
        <div className="absolute right-0 z-50 mt-2 flex flex-col gap-3 rounded-xl border border-border-strong bg-surface-1 p-3 shadow-2xl sm:flex-row">
          {/* Presets */}
          <div className="flex flex-row flex-wrap gap-1 sm:w-32 sm:flex-col">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setRange(p.range);
                  setPendingStart(null);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
                  sameRange(range, p.range) ? "bg-[var(--accent-soft)] text-accent" : "text-secondary hover:bg-surface-2",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div className="w-[248px] border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
            <div className="mb-2 flex items-center justify-between">
              <button
                onClick={() => canPrev && shiftMonth(-1)}
                disabled={!canPrev}
                className="grid size-7 place-items-center rounded-md text-secondary transition-colors hover:bg-surface-2 disabled:opacity-30"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium">{monthLabel}</span>
              <button
                onClick={() => canNext && shiftMonth(1)}
                disabled={!canNext}
                className="grid size-7 place-items-center rounded-md text-secondary transition-colors hover:bg-surface-2 disabled:opacity-30"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="grid h-7 place-items-center text-[11px] text-muted">
                  {w}
                </span>
              ))}
              {cells.map((iso, i) => {
                if (!iso) return <span key={i} />;
                const disabled = iso < bounds.from || iso > bounds.to;
                const isStart = iso === highlightFrom;
                const isEnd = iso === highlightTo;
                const inRange =
                  !pendingStart && highlightFrom && highlightTo && iso >= highlightFrom && iso <= highlightTo;
                const dayNum = parse(iso).getUTCDate();
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => onDay(iso)}
                    className={cn(
                      "relative grid h-8 place-items-center text-xs tabular transition-colors",
                      disabled && "text-muted opacity-40",
                      !disabled && !inRange && !isStart && !isEnd && "text-secondary hover:bg-surface-2 rounded-md",
                      inRange && !isStart && !isEnd && "bg-[var(--accent-soft)] text-primary",
                      (isStart || isEnd) && "rounded-md bg-accent font-medium text-white",
                    )}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
            {pendingStart && (
              <p className="mt-2 text-[11px] text-muted">Pick the end date…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
