import { SHIFTS, ShiftId, Transaction } from "./types";

/** Pure selectors over Transaction[] — the fan/spender dimension. */

// ---- MMPPV / decimal classification -------------------------------------

/** The cents portion of an amount, 0–99, robust to float error. */
export function centsOf(amount: number): number {
  return Math.round((amount - Math.trunc(amount)) * 100);
}

/** A sale is MMPPV when its cents match one of the configured decimals. */
export function isMMPPV(t: Transaction, decimals: number[] | Set<number>): boolean {
  const set = decimals instanceof Set ? decimals : new Set(decimals);
  return set.has(centsOf(t.earnings));
}

/** Split into chatter-attributable vs MMPPV (excluded) by the decimals. */
export function partitionMMPPV(txns: Transaction[], decimals: number[]) {
  if (!decimals.length) return { attributable: txns, mmppv: [] as Transaction[] };
  const set = new Set(decimals);
  const attributable: Transaction[] = [];
  const mmppv: Transaction[] = [];
  for (const t of txns) (set.has(centsOf(t.earnings)) ? mmppv : attributable).push(t);
  return { attributable, mmppv };
}

/** Every cents value present in the data, ranked by total — powers the picker. */
export function decimalDistribution(txns: Transaction[]) {
  const map = new Map<number, { total: number; count: number }>();
  for (const t of txns) {
    const c = centsOf(t.earnings);
    const cur = map.get(c) ?? { total: 0, count: 0 };
    cur.total += t.earnings;
    cur.count += 1;
    map.set(c, cur);
  }
  return Array.from(map.entries())
    .map(([cents, v]) => ({ cents, ...v }))
    .sort((a, b) => b.total - a.total);
}

export const fmtCents = (c: number) => `.${String(c).padStart(2, "0")}`;

export interface SpenderRow {
  fanId: string;
  fanName: string;
  total: number;
  count: number;
  avg: number;
  models: number;
  lastAt: string;
  topModel: string;
}

export function topSpenders(txns: Transaction[], limit?: number): SpenderRow[] {
  const byFan = new Map<string, Transaction[]>();
  for (const t of txns) {
    const arr = byFan.get(t.fanId) ?? [];
    arr.push(t);
    byFan.set(t.fanId, arr);
  }
  const rows: SpenderRow[] = [];
  for (const [fanId, ts] of byFan) {
    const total = ts.reduce((a, t) => a + t.earnings, 0);
    const perModel = new Map<string, number>();
    for (const t of ts) perModel.set(t.creator, (perModel.get(t.creator) ?? 0) + t.earnings);
    const topModel = Array.from(perModel.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    rows.push({
      fanId,
      fanName: ts[0].fanName,
      total,
      count: ts.length,
      avg: total / ts.length,
      models: perModel.size,
      lastAt: ts.reduce((m, t) => (t.datetime > m ? t.datetime : m), ts[0].datetime),
      topModel,
    });
  }
  rows.sort((a, b) => b.total - a.total);
  return limit ? rows.slice(0, limit) : rows;
}

export interface RankedRow {
  id: string;
  name: string;
  subtitle: string;
  total: number;
  count: number;
}

/** Chatters ranked by revenue generated in this transaction set. */
export function chattersRanked(txns: Transaction[], limit?: number): RankedRow[] {
  const by = new Map<string, Transaction[]>();
  for (const t of txns) {
    const arr = by.get(t.chatterId) ?? [];
    arr.push(t);
    by.set(t.chatterId, arr);
  }
  const rows = Array.from(by.entries()).map(([id, ts]) => ({
    id,
    name: ts[0].chatterName,
    subtitle: `${ts.length} sales`,
    total: ts.reduce((a, t) => a + t.earnings, 0),
    count: ts.length,
  }));
  rows.sort((a, b) => b.total - a.total);
  return limit ? rows.slice(0, limit) : rows;
}

/** Models ranked within a transaction set (used on fan detail). */
export function modelsRanked(txns: Transaction[], limit?: number): RankedRow[] {
  const by = new Map<string, Transaction[]>();
  for (const t of txns) {
    const arr = by.get(t.creator) ?? [];
    arr.push(t);
    by.set(t.creator, arr);
  }
  const rows = Array.from(by.entries()).map(([id, ts]) => ({
    id,
    name: id,
    subtitle: `${ts.length} sales`,
    total: ts.reduce((a, t) => a + t.earnings, 0),
    count: ts.length,
  }));
  rows.sort((a, b) => b.total - a.total);
  return limit ? rows.slice(0, limit) : rows;
}

export const txnsForModel = (txns: Transaction[], modelId: string) =>
  txns.filter((t) => t.creator === modelId);
export const txnsForFan = (txns: Transaction[], fanId: string) => txns.filter((t) => t.fanId === fanId);
export const txnsForChatter = (txns: Transaction[], chatterId: string) =>
  txns.filter((t) => t.chatterId === chatterId);

export function spendByDay(txns: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of txns) map.set(t.date, (map.get(t.date) ?? 0) + t.earnings);
  return Array.from(map.entries())
    .map(([date, net]) => ({ date, net }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function spendByShift(txns: Transaction[]) {
  return SHIFTS.map((s) => ({
    shift: s.label,
    id: s.id as ShiftId,
    net: txns.filter((t) => t.shift === s.id).reduce((a, t) => a + t.earnings, 0),
  }));
}

export interface TxnTotals {
  total: number;
  count: number;
  avg: number;
  fans: number;
  first: string | null;
  last: string | null;
}

export function txnTotals(txns: Transaction[]): TxnTotals {
  if (txns.length === 0) return { total: 0, count: 0, avg: 0, fans: 0, first: null, last: null };
  let total = 0;
  let first = txns[0].datetime;
  let last = txns[0].datetime;
  const fans = new Set<string>();
  for (const t of txns) {
    total += t.earnings;
    fans.add(t.fanId);
    if (t.datetime < first) first = t.datetime;
    if (t.datetime > last) last = t.datetime;
  }
  return { total, count: txns.length, avg: total / txns.length, fans: fans.size, first, last };
}
