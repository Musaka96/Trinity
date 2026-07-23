import { SpenderRow } from "./transactions";

/**
 * Spend tiers ("tags") classify a fan by how much they've spent.
 * Fully user-configurable: labels, thresholds, colours, and how many tiers.
 *
 * A fan gets the highest tier whose `minTotal` they meet, so tiers only need a
 * lower bound. Keep one tier at 0 to catch everyone.
 */

export interface SpendTier {
  id: string;
  label: string;
  /** Inclusive lower bound on lifetime spend (in the selected period). */
  minTotal: number;
  color: string;
}

export const TIER_COLORS = [
  "#6d5cff", "#3987e5", "#199e70", "#c98500", "#d55181",
  "#d95926", "#9085e9", "#e66767", "#6b7280",
];

export const DEFAULT_TIERS: SpendTier[] = [
  { id: "whale", label: "Whale", minTotal: 500, color: "#6d5cff" },
  { id: "mid", label: "Mid spender", minTotal: 100, color: "#3987e5" },
  { id: "small", label: "Small spender", minTotal: 0, color: "#6b7280" },
];

/** Highest threshold first — the order tiers are matched and displayed in. */
export function sortTiers(tiers: SpendTier[]): SpendTier[] {
  return [...tiers].sort((a, b) => b.minTotal - a.minTotal);
}

export function tierFor(total: number, tiers: SpendTier[]): SpendTier | null {
  for (const t of sortTiers(tiers)) {
    if (total >= t.minTotal) return t;
  }
  return null;
}

export interface TierBucket {
  tier: SpendTier;
  count: number;
  total: number;
}

/** Group spenders into their tiers — used for the "spender mix" breakdowns. */
export function bucketByTier(spenders: SpenderRow[], tiers: SpendTier[]): TierBucket[] {
  const sorted = sortTiers(tiers);
  const buckets = new Map<string, TierBucket>(
    sorted.map((t) => [t.id, { tier: t, count: 0, total: 0 }]),
  );
  for (const s of spenders) {
    const t = tierFor(s.total, sorted);
    if (!t) continue;
    const b = buckets.get(t.id);
    if (!b) continue;
    b.count += 1;
    b.total += s.total;
  }
  return sorted.map((t) => buckets.get(t.id)!).filter(Boolean);
}

/** Human label for a tier's range, e.g. "$100 – $500" or "$500+". */
export function tierRangeLabel(tier: SpendTier, tiers: SpendTier[]): string {
  const sorted = sortTiers(tiers);
  const idx = sorted.findIndex((t) => t.id === tier.id);
  const above = idx > 0 ? sorted[idx - 1].minTotal : null;
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  if (above === null) return `${fmt(tier.minTotal)}+`;
  return tier.minTotal === 0 ? `< ${fmt(above)}` : `${fmt(tier.minTotal)} – ${fmt(above)}`;
}

export function newTierId(): string {
  return `tier_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
}
