import { chatters, models, salesRecords } from "./mock-data";
import { Chatter, Model, SalesRecord, ShiftId, SHIFTS } from "./types";

/**
 * Read-model selectors over the sales records. Pure functions so they can
 * run on the server (RSC) and be swapped to hit a real DB/API later without
 * touching the components that call them.
 */

export const allRecords = salesRecords;
export const allModels = models;
export const allChatters = chatters;

export function recordsInLastDays(days: number): SalesRecord[] {
  const dates = Array.from(new Set(salesRecords.map((r) => r.date))).sort();
  const cutoff = dates[Math.max(0, dates.length - days)];
  return salesRecords.filter((r) => r.date >= cutoff);
}

export interface Totals {
  net: number;
  gross: number;
  ppvSent: number;
  ppvUnlocked: number;
  tips: number;
  messagesSent: number;
  fansChatted: number;
  records: number;
}

export function sumTotals(records: SalesRecord[]): Totals {
  return records.reduce<Totals>(
    (acc, r) => {
      acc.net += r.net;
      acc.gross += r.gross;
      acc.ppvSent += r.ppvSent;
      acc.ppvUnlocked += r.ppvUnlocked;
      acc.tips += r.tips;
      acc.messagesSent += r.messagesSent;
      acc.fansChatted += r.fansChatted;
      acc.records += 1;
      return acc;
    },
    { net: 0, gross: 0, ppvSent: 0, ppvUnlocked: 0, tips: 0, messagesSent: 0, fansChatted: 0, records: 0 },
  );
}

export function changePct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

/** Net revenue per day, optionally split by shift. */
export function revenueByDay(records: SalesRecord[]) {
  const map = new Map<string, { date: string; morning: number; afternoon: number; night: number; net: number }>();
  for (const r of records) {
    const row = map.get(r.date) ?? { date: r.date, morning: 0, afternoon: 0, night: 0, net: 0 };
    row[r.shift] += r.net;
    row.net += r.net;
    map.set(r.date, row);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function revenueByShift(records: SalesRecord[]) {
  return SHIFTS.map((s) => ({
    shift: s.label,
    id: s.id,
    net: records.filter((r) => r.shift === s.id).reduce((a, r) => a + r.net, 0),
  }));
}

export interface LeaderRow {
  id: string;
  name: string;
  avatar: string;
  subtitle: string;
  net: number;
  ppvUnlocked: number;
  messagesSent: number;
  unlockRate: number;
}

export function topChatters(records: SalesRecord[], limit = 8): LeaderRow[] {
  const byChatter = new Map<string, SalesRecord[]>();
  for (const r of records) {
    const arr = byChatter.get(r.chatterId) ?? [];
    arr.push(r);
    byChatter.set(r.chatterId, arr);
  }
  const rows: LeaderRow[] = [];
  for (const [id, recs] of byChatter) {
    const c = chatters.find((x) => x.id === id);
    if (!c) continue;
    const t = sumTotals(recs);
    rows.push({
      id,
      name: c.name,
      avatar: c.avatar,
      subtitle: `Team ${c.team}`,
      net: t.net,
      ppvUnlocked: t.ppvUnlocked,
      messagesSent: t.messagesSent,
      unlockRate: t.ppvSent ? (t.ppvUnlocked / t.ppvSent) * 100 : 0,
    });
  }
  return rows.sort((a, b) => b.net - a.net).slice(0, limit);
}

export function topModels(records: SalesRecord[], limit = 8): LeaderRow[] {
  const byModel = new Map<string, SalesRecord[]>();
  for (const r of records) {
    const arr = byModel.get(r.modelId) ?? [];
    arr.push(r);
    byModel.set(r.modelId, arr);
  }
  const rows: LeaderRow[] = [];
  for (const [id, recs] of byModel) {
    const m = models.find((x) => x.id === id);
    if (!m) continue;
    const t = sumTotals(recs);
    rows.push({
      id,
      name: m.name,
      avatar: m.avatar,
      subtitle: m.platform,
      net: t.net,
      ppvUnlocked: t.ppvUnlocked,
      messagesSent: t.messagesSent,
      unlockRate: t.ppvSent ? (t.ppvUnlocked / t.ppvSent) * 100 : 0,
    });
  }
  return rows.sort((a, b) => b.net - a.net).slice(0, limit);
}

// ---- Entity detail --------------------------------------------------------

export function getChatter(id: string): Chatter | undefined {
  return chatters.find((c) => c.id === id);
}
export function getModel(id: string): Model | undefined {
  return models.find((m) => m.id === id);
}

export function recordsForChatter(id: string, records = salesRecords) {
  return records.filter((r) => r.chatterId === id);
}
export function recordsForModel(id: string, records = salesRecords) {
  return records.filter((r) => r.modelId === id);
}

/** Which models a chatter worked, ranked by revenue. */
export function chatterModelBreakdown(chatterId: string, records = salesRecords) {
  const recs = recordsForChatter(chatterId, records);
  const map = new Map<string, number>();
  for (const r of recs) map.set(r.modelId, (map.get(r.modelId) ?? 0) + r.net);
  return Array.from(map.entries())
    .map(([modelId, net]) => ({ model: models.find((m) => m.id === modelId)!, net }))
    .filter((x) => x.model)
    .sort((a, b) => b.net - a.net);
}

export function chatterShiftSplit(chatterId: string, records = salesRecords) {
  const recs = recordsForChatter(chatterId, records);
  return SHIFTS.map((s) => ({
    shift: s.label,
    id: s.id,
    net: recs.filter((r) => r.shift === s.id).reduce((a, r) => a + r.net, 0),
  }));
}

/** Which chatters worked a model, ranked by revenue. */
export function modelChatterBreakdown(modelId: string, records = salesRecords) {
  const recs = recordsForModel(modelId, records);
  const map = new Map<string, number>();
  for (const r of recs) map.set(r.chatterId, (map.get(r.chatterId) ?? 0) + r.net);
  return Array.from(map.entries())
    .map(([chatterId, net]) => ({ chatter: chatters.find((c) => c.id === chatterId)!, net }))
    .filter((x) => x.chatter)
    .sort((a, b) => b.net - a.net);
}

export function modelShiftSplit(modelId: string, records = salesRecords) {
  const recs = recordsForModel(modelId, records);
  return SHIFTS.map((s) => ({
    shift: s.label,
    id: s.id,
    net: recs.filter((r) => r.shift === s.id).reduce((a, r) => a + r.net, 0),
  }));
}

export function revenueByPlatform(records: SalesRecord[]) {
  const map = new Map<string, number>();
  for (const r of records) {
    const m = models.find((x) => x.id === r.modelId);
    if (!m) continue;
    map.set(m.platform, (map.get(m.platform) ?? 0) + r.net);
  }
  return Array.from(map.entries())
    .map(([platform, net]) => ({ platform, net }))
    .sort((a, b) => b.net - a.net);
}

export function revenueByTeam(records: SalesRecord[]) {
  const map = new Map<string, number>();
  for (const r of records) {
    const c = chatters.find((x) => x.id === r.chatterId);
    if (!c) continue;
    map.set(c.team, (map.get(c.team) ?? 0) + r.net);
  }
  return Array.from(map.entries())
    .map(([team, net]) => ({ team, net }))
    .sort((a, b) => b.net - a.net);
}

// ---- Shift board ----------------------------------------------------------

export function availableDates(): string[] {
  return Array.from(new Set(salesRecords.map((r) => r.date))).sort();
}

export interface BoardAssignment {
  chatter: Chatter;
  net: number;
  models: { model: Model; net: number }[];
}

export interface BoardColumn {
  shift: (typeof SHIFTS)[number];
  net: number;
  assignments: BoardAssignment[];
}

/** Per-shift roster for a given date: chatters and the models they covered. */
export function shiftBoard(date: string): BoardColumn[] {
  const dayRecs = salesRecords.filter((r) => r.date === date);
  return SHIFTS.map((shift) => {
    const recs = dayRecs.filter((r) => r.shift === shift.id);
    const byChatter = new Map<string, SalesRecord[]>();
    for (const r of recs) {
      const arr = byChatter.get(r.chatterId) ?? [];
      arr.push(r);
      byChatter.set(r.chatterId, arr);
    }
    const assignments: BoardAssignment[] = [];
    for (const [chatterId, cRecs] of byChatter) {
      const chatter = chatters.find((c) => c.id === chatterId);
      if (!chatter) continue;
      const modelMap = new Map<string, number>();
      for (const r of cRecs) modelMap.set(r.modelId, (modelMap.get(r.modelId) ?? 0) + r.net);
      assignments.push({
        chatter,
        net: cRecs.reduce((a, r) => a + r.net, 0),
        models: Array.from(modelMap.entries())
          .map(([mid, net]) => ({ model: models.find((m) => m.id === mid)!, net }))
          .filter((x) => x.model)
          .sort((a, b) => b.net - a.net),
      });
    }
    assignments.sort((a, b) => b.net - a.net);
    return { shift, net: recs.reduce((a, r) => a + r.net, 0), assignments };
  });
}
