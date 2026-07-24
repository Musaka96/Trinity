import { Chatter, FULL_DAY_SHIFT, Model, SHIFTS, ShiftId, StatRow } from "./types";

/**
 * Pure selectors over StatRow[]. Nothing here reads a global dataset — the
 * caller (the data store) passes the effective rows, so the same functions
 * work on the full set or any filtered slice.
 */

export interface Totals {
  sales: number;
  ppvSales: number;
  tips: number;
  dmSales: number;
  dmsSent: number;
  ppvsSent: number;
  ppvsUnlocked: number;
  priorityMassSales: number;
  ofMassSales: number;
  fansChatted: number;
  fansWhoSpent: number;
  charCount: number;
  rows: number;
}

export function sumTotals(rows: StatRow[]): Totals {
  const t: Totals = {
    sales: 0, ppvSales: 0, tips: 0, dmSales: 0, dmsSent: 0, ppvsSent: 0,
    ppvsUnlocked: 0, priorityMassSales: 0, ofMassSales: 0, fansChatted: 0,
    fansWhoSpent: 0, charCount: 0, rows: 0,
  };
  for (const r of rows) {
    t.sales += r.sales;
    t.ppvSales += r.ppvSales;
    t.tips += r.tips;
    t.dmSales += r.dmSales;
    t.dmsSent += r.dmsSent;
    t.ppvsSent += r.ppvsSent;
    t.ppvsUnlocked += r.ppvsUnlocked;
    t.priorityMassSales += r.priorityMassSales;
    t.ofMassSales += r.ofMassSales;
    t.fansChatted += r.fansChatted;
    t.fansWhoSpent += r.fansWhoSpent;
    t.charCount += r.charCount;
    t.rows += 1;
  }
  return t;
}

export const unlockRate = (t: Totals) => (t.ppvsSent ? (t.ppvsUnlocked / t.ppvsSent) * 100 : 0);
export const fanCVR = (t: Totals) => (t.fansChatted ? (t.fansWhoSpent / t.fansChatted) * 100 : 0);
export const avgPerFan = (t: Totals) => (t.fansWhoSpent ? t.sales / t.fansWhoSpent : 0);
/** infloww's "Golden ratio": PPVs sent per message sent. */
export const goldenRatio = (t: Totals) => (t.dmsSent ? (t.ppvsSent / t.dmsSent) * 100 : 0);
export const avgCharsPerMessage = (t: Totals) => (t.dmsSent ? t.charCount / t.dmsSent : 0);
export const avgPerUnlock = (t: Totals) => (t.ppvsUnlocked ? t.ppvSales / t.ppvsUnlocked : 0);

export function changePct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

// ---- Time series ----------------------------------------------------------

export function availableDates(rows: StatRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.date))).sort();
}

export function salesByDay(rows: StatRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.sales);
  return Array.from(map.entries())
    .map(([date, net]) => ({ date, net }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Daily sales stacked by shift (for the composition chart). */
export function salesByDayShift(rows: StatRow[]) {
  const map = new Map<string, { date: string; morning: number; afternoon: number; night: number; full: number }>();
  for (const r of rows) {
    const row = map.get(r.date) ?? { date: r.date, morning: 0, afternoon: 0, night: 0, full: 0 };
    row[r.shift] += r.sales;
    map.set(r.date, row);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function activeShifts(rows: StatRow[]) {
  const present = new Set(rows.map((r) => r.shift));
  const list = SHIFTS.filter((s) => present.has(s.id));
  if (present.has("full")) list.push(FULL_DAY_SHIFT);
  return list.length ? list : [FULL_DAY_SHIFT];
}

export function salesByShift(rows: StatRow[]) {
  return activeShifts(rows).map((s) => ({
    shift: s.label,
    id: s.id,
    net: rows.filter((r) => r.shift === s.id).reduce((a, r) => a + r.sales, 0),
  }));
}

// ---- Leaderboards ---------------------------------------------------------

export interface LeaderRow {
  id: string;
  name: string;
  subtitle: string;
  net: number;
  unlockRate: number;
  fansChatted: number;
  dmsSent: number;
}

function leaderRow(id: string, name: string, subtitle: string, rows: StatRow[]): LeaderRow {
  const t = sumTotals(rows);
  return { id, name, subtitle, net: t.sales, unlockRate: unlockRate(t), fansChatted: t.fansChatted, dmsSent: t.dmsSent };
}

export function topChatters(rows: StatRow[], chatters: Chatter[], limit = 8): LeaderRow[] {
  const byId = groupBy(rows, (r) => r.chatterId);
  return chatters
    .map((c) => leaderRow(c.id, c.name, c.group, byId.get(c.id) ?? []))
    .filter((r) => r.net > 0 || (byId.get(r.id)?.length ?? 0) > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, limit);
}

export function topModels(rows: StatRow[], models: Model[], limit = 8): LeaderRow[] {
  const byId = groupBy(rows, (r) => r.creator);
  return models
    .map((m) => leaderRow(m.id, m.name, m.platform + (m.tier !== "Standard" ? ` · ${m.tier}` : ""), byId.get(m.id) ?? []))
    .sort((a, b) => b.net - a.net)
    .slice(0, limit);
}

// ---- Entity slices --------------------------------------------------------

export const rowsForChatter = (rows: StatRow[], id: string) => rows.filter((r) => r.chatterId === id);
export const rowsForModel = (rows: StatRow[], id: string) => rows.filter((r) => r.creator === id);

export function chatterModelBreakdown(rows: StatRow[], chatterId: string, models: Model[]) {
  const recs = rowsForChatter(rows, chatterId);
  const map = groupBy(recs, (r) => r.creator);
  return Array.from(map.entries())
    .map(([creator, rs]) => ({ model: models.find((m) => m.id === creator), net: rs.reduce((a, r) => a + r.sales, 0) }))
    .filter((x): x is { model: Model; net: number } => !!x.model)
    .sort((a, b) => b.net - a.net);
}

export function modelChatterBreakdown(rows: StatRow[], modelId: string, chatters: Chatter[]) {
  const recs = rowsForModel(rows, modelId);
  const map = groupBy(recs, (r) => r.chatterId);
  return Array.from(map.entries())
    .map(([id, rs]) => ({ chatter: chatters.find((c) => c.id === id), net: rs.reduce((a, r) => a + r.sales, 0) }))
    .filter((x): x is { chatter: Chatter; net: number } => !!x.chatter)
    .sort((a, b) => b.net - a.net);
}

// ---- Composition ----------------------------------------------------------

/** Sales = PPV sales + Tips. */
export function revenueComposition(t: Totals) {
  return [
    { label: "PPV sales", value: t.ppvSales },
    { label: "Tips", value: t.tips },
  ].filter((d) => d.value > 0);
}

/** PPV sales channels: DM vs mass messages. */
export function channelSplit(t: Totals) {
  return [
    { label: "Direct messages", value: t.dmSales },
    { label: "OF mass messages", value: t.ofMassSales },
    { label: "Priority mass", value: t.priorityMassSales },
  ].filter((d) => d.value > 0);
}

export function salesByPlatform(rows: StatRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.platform, (map.get(r.platform) ?? 0) + r.sales);
  return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function salesByTier(rows: StatRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.tier, (map.get(r.tier) ?? 0) + r.sales);
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// ---- Shift / daily board --------------------------------------------------

export interface BoardAssignment {
  chatter: Chatter;
  net: number;
  models: { model: Model; net: number }[];
}
export interface BoardColumn {
  id: ShiftId;
  label: string;
  start: string;
  end: string;
  net: number;
  assignments: BoardAssignment[];
}

export function board(rows: StatRow[], date: string, chatters: Chatter[], models: Model[]): BoardColumn[] {
  const dayRows = rows.filter((r) => r.date === date);
  const shifts = activeShifts(dayRows);
  return shifts.map((shift) => {
    const recs = dayRows.filter((r) => r.shift === shift.id);
    const byChatter = groupBy(recs, (r) => r.chatterId);
    const assignments: BoardAssignment[] = [];
    for (const [id, rs] of byChatter) {
      const chatter = chatters.find((c) => c.id === id);
      if (!chatter) continue;
      const byModel = groupBy(rs, (r) => r.creator);
      assignments.push({
        chatter,
        net: rs.reduce((a, r) => a + r.sales, 0),
        models: Array.from(byModel.entries())
          .map(([cid, mr]) => ({ model: models.find((m) => m.id === cid), net: mr.reduce((a, r) => a + r.sales, 0) }))
          .filter((x): x is { model: Model; net: number } => !!x.model)
          .sort((a, b) => b.net - a.net),
      });
    }
    assignments.sort((a, b) => b.net - a.net);
    return {
      id: shift.id,
      label: shift.label,
      start: shift.start,
      end: shift.end,
      net: recs.reduce((a, r) => a + r.sales, 0),
      assignments,
    };
  });
}

// ---- utils ----------------------------------------------------------------

function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = map.get(k) ?? [];
    arr.push(it);
    map.set(k, arr);
  }
  return map;
}
