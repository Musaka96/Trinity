/**
 * Trinity domain model — shaped to the infloww export.
 *
 * The finest grain in an infloww "Detailed breakdown" is one row per
 * (day, employee/chatter, creator/model). That is our canonical fact row,
 * `StatRow`. Chatters and Models are derived from the set of rows.
 */

export type Platform = "OnlyFans" | "Fansly" | "Fanvue" | "Other";

/**
 * Shifts run 04:00–12:00, 12:00–20:00, 20:00–04:00 (Europe/Belgrade).
 * infloww encodes the window in the Date/Time range, so a per-shift export
 * lands in the right bucket; a whole-day export lands in "full".
 */
export type ShiftId = "morning" | "afternoon" | "night" | "full";

export interface Shift {
  id: ShiftId;
  label: string;
  start: string;
  end: string;
  /** Start hour used to bucket a row by its report window. */
  startHour: number;
}

export const SHIFTS: Shift[] = [
  { id: "morning", label: "Morning", start: "04:00", end: "12:00", startHour: 4 },
  { id: "afternoon", label: "Afternoon", start: "12:00", end: "20:00", startHour: 12 },
  { id: "night", label: "Night", start: "20:00", end: "04:00", startHour: 20 },
];

export const FULL_DAY_SHIFT: Shift = {
  id: "full",
  label: "Full day",
  start: "00:00",
  end: "24:00",
  startHour: 0,
};

/** Bucket a report window (its start hour) into a shift. */
export function shiftFromRange(startHour: number, isFullDay: boolean): ShiftId {
  if (isFullDay) return "full";
  if (startHour >= 4 && startHour < 12) return "morning";
  if (startHour >= 12 && startHour < 20) return "afternoon";
  return "night";
}

/** One chatter's output on one creator, on one day. */
export interface StatRow {
  /** Upsert key: `${date}::${chatterId}::${creator}`. */
  key: string;
  date: string; // YYYY-MM-DD
  shift: ShiftId;
  chatterId: string; // email, lowercased — stable id
  chatterName: string;
  group: string;
  creator: string; // clean creator name, e.g. "Silvia Saige VIP"
  platform: Platform;
  /** Free / VIP tier when the creator name encodes it. */
  tier: "VIP" | "Free" | "Standard";

  sales: number;
  ppvSales: number;
  tips: number;
  dmSales: number;
  dmsSent: number; // direct messages sent
  ppvsSent: number; // direct PPVs sent
  ppvsUnlocked: number;
  priorityMassSales: number;
  ofMassSales: number;
  fansChatted: number;
  fansWhoSpent: number;
  charCount: number;
}

/**
 * A single fan payment: one row of the transaction-level infloww report
 * (Date & time · Employee · Creator · Fan · Earnings).
 *
 * Unlike StatRow this carries a real timestamp, so the shift is exact, and a
 * `fan` dimension, which powers spender rankings and per-spender history.
 */
export interface Transaction {
  /** Upsert key. */
  id: string;
  /** Full ISO timestamp (UTC). */
  datetime: string;
  /** YYYY-MM-DD, derived from datetime — used by the date-range filter. */
  date: string;
  /** Derived from the hour of day: 04–12 / 12–20 / 20–04. */
  shift: ShiftId;
  chatterId: string;
  chatterName: string;
  group: string;
  creator: string;
  platform: Platform;
  tier: "VIP" | "Free" | "Standard";
  fanId: string;
  fanName: string;
  earnings: number;
}

export interface Fan {
  id: string;
  name: string;
}

export interface Chatter {
  id: string; // email
  name: string;
  group: string;
}

export interface Model {
  id: string; // clean creator name (unique in the export)
  name: string;
  platform: Platform;
  tier: "VIP" | "Free" | "Standard";
}

export interface Dataset {
  rows: StatRow[];
  /** ISO timestamp of the last import/update. */
  updatedAt: string | null;
}
