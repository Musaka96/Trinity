import { ShiftId } from "./types";

/**
 * Events annotate the data with context that explains the numbers:
 * a promotion, a takeover, a bad day, a holiday, or a free-form note.
 * They propagate to any view whose (date, model, chatter, shift) they match.
 */

export type EventType = "promotion" | "takeover" | "bad_day" | "holiday" | "note";

export interface TrinityEvent {
  id: string;
  type: EventType;
  title: string;
  note?: string;
  /** Inclusive start date (YYYY-MM-DD). */
  date: string;
  /** Optional inclusive end date for multi-day events. */
  endDate?: string;
  /** Scope — any left blank means "applies to all". */
  modelId?: string;
  chatterId?: string;
  shift?: ShiftId;
  createdAt: string;
}

export const EVENT_META: Record<
  EventType,
  { label: string; badge: "good" | "accent" | "warning" | "critical" | "neutral"; color: string; emoji: string }
> = {
  promotion: { label: "Promotion", badge: "good", color: "var(--good)", emoji: "🎯" },
  takeover: { label: "Takeover", badge: "accent", color: "var(--accent)", emoji: "🔄" },
  bad_day: { label: "Bad day", badge: "critical", color: "var(--critical)", emoji: "📉" },
  holiday: { label: "Holiday", badge: "warning", color: "var(--warning)", emoji: "🏖️" },
  note: { label: "Note", badge: "neutral", color: "var(--text-muted)", emoji: "📝" },
};

export const EVENT_TYPES: EventType[] = ["promotion", "takeover", "bad_day", "holiday", "note"];

function inRange(ev: TrinityEvent, date: string): boolean {
  const end = ev.endDate ?? ev.date;
  return date >= ev.date && date <= end;
}

export interface MatchCtx {
  date?: string;
  modelId?: string;
  chatterId?: string;
  shift?: ShiftId;
}

/** Does an event apply to the given context? Blank scope on the event = wildcard. */
export function eventMatches(ev: TrinityEvent, ctx: MatchCtx): boolean {
  if (ctx.date != null && !inRange(ev, ctx.date)) return false;
  if (ev.modelId && ctx.modelId != null && ev.modelId !== ctx.modelId) return false;
  if (ev.chatterId && ctx.chatterId != null && ev.chatterId !== ctx.chatterId) return false;
  if (ev.shift && ctx.shift != null && ev.shift !== ctx.shift) return false;
  return true;
}

export function eventsFor(events: TrinityEvent[], ctx: MatchCtx): TrinityEvent[] {
  return events
    .filter((ev) => eventMatches(ev, ctx))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Events that touch a given model at all (any date). */
export function eventsForModel(events: TrinityEvent[], modelId: string): TrinityEvent[] {
  return events.filter((ev) => !ev.modelId || ev.modelId === modelId).sort((a, b) => b.date.localeCompare(a.date));
}

export function eventsForChatter(events: TrinityEvent[], chatterId: string): TrinityEvent[] {
  return events.filter((ev) => !ev.chatterId || ev.chatterId === chatterId).sort((a, b) => b.date.localeCompare(a.date));
}

/** Dates (within a set) that have at least one event — for chart markers. */
export function eventDates(events: TrinityEvent[], dates: string[]): Map<string, TrinityEvent[]> {
  const map = new Map<string, TrinityEvent[]>();
  for (const d of dates) {
    const hits = events.filter((ev) => inRange(ev, d));
    if (hits.length) map.set(d, hits);
  }
  return map;
}
