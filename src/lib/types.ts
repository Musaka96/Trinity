/**
 * Trinity domain model.
 *
 * Shapes mirror an inflow-style sales export so a real import maps onto
 * these types with minimal transformation. All revenue values are in the
 * account's base currency (USD) unless noted.
 */

export type ShiftId = "morning" | "afternoon" | "night";

export interface Shift {
  id: ShiftId;
  label: string;
  /** 24h local start/end, for schedule rendering. */
  start: string;
  end: string;
}

export const SHIFTS: Shift[] = [
  { id: "morning", label: "Morning", start: "06:00", end: "14:00" },
  { id: "afternoon", label: "Afternoon", start: "14:00", end: "22:00" },
  { id: "night", label: "Night", start: "22:00", end: "06:00" },
];

export type EntityStatus = "active" | "paused" | "inactive";

export type Platform = "OnlyFans" | "Fansly" | "Fanvue";

export interface Model {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  platform: Platform;
  status: EntityStatus;
  joinedAt: string; // ISO date
  tags: string[];
  /** Total active subscribers on the platform. */
  subscribers: number;
  subscriptionPrice: number;
}

export interface Chatter {
  id: string;
  name: string;
  avatar: string;
  status: EntityStatus;
  hiredAt: string; // ISO date
  team: string;
  languages: string[];
  /** Shifts this chatter usually covers. */
  defaultShifts: ShiftId[];
}

/** One chatter's output on one model, during one shift, on one day. */
export interface SalesRecord {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  shift: ShiftId;
  chatterId: string;
  modelId: string;
  /** Net revenue after platform fees. */
  net: number;
  gross: number;
  ppvSent: number;
  ppvUnlocked: number;
  tips: number;
  messagesSent: number;
  fansChatted: number;
}

export interface KpiDelta {
  value: number;
  /** Percentage change vs the comparison period. */
  changePct: number;
}
