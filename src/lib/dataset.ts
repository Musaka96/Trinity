import { Chatter, Dataset, Model, StatRow } from "./types";

/** Derive the unique chatters present in a set of rows. */
export function deriveChatters(rows: StatRow[]): Chatter[] {
  const map = new Map<string, Chatter>();
  for (const r of rows) {
    if (!map.has(r.chatterId)) {
      map.set(r.chatterId, { id: r.chatterId, name: r.chatterName, group: r.group });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Derive the unique creators/models present in a set of rows. */
export function deriveModels(rows: StatRow[]): Model[] {
  const map = new Map<string, Model>();
  for (const r of rows) {
    if (!map.has(r.creator)) {
      map.set(r.creator, { id: r.creator, name: r.creator, platform: r.platform, tier: r.tier });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Upsert `incoming` rows into `base`, keyed by StatRow.key
 * (date + shift + chatter + creator). Re-importing a period overwrites the
 * previous values for the same keys — so corrected exports update in place.
 */
export function mergeDataset(base: Dataset, incoming: StatRow[]): Dataset {
  const byKey = new Map<string, StatRow>();
  for (const r of base.rows) byKey.set(r.key, r);
  for (const r of incoming) byKey.set(r.key, r);
  return {
    rows: Array.from(byKey.values()).sort((a, b) => a.date.localeCompare(b.date)),
    updatedAt: new Date().toISOString(),
  };
}

export function emptyDataset(): Dataset {
  return { rows: [], updatedAt: null };
}

/** Which dates/shifts an import touched — for the "what changed" summary. */
export function importDiff(base: Dataset, incoming: StatRow[]) {
  const existing = new Set(base.rows.map((r) => r.key));
  let added = 0;
  let updated = 0;
  for (const r of incoming) (existing.has(r.key) ? updated++ : added++);
  const dates = Array.from(new Set(incoming.map((r) => r.date))).sort();
  return { added, updated, dates };
}
