/**
 * Durable local persistence.
 *
 * Imports and events are written to localStorage under versioned keys and
 * survive reloads and sessions on this machine. The seed ships with the app
 * and is never stored — only the user's imports (deltas) and events are, so
 * storage stays small and seed updates flow through on new deploys.
 *
 * This is deliberately a thin, swappable adapter: pointing `load`/`save` at a
 * server route (Vercel Postgres/KV) later makes the data shared across devices
 * without touching the store or the UI.
 */

export const IMPORTS_KEY = "trinity.imports.v2";
export const EVENTS_KEY = "trinity.events.v1";
export const TXNS_KEY = "trinity.transactions.v1";
export const TIERS_KEY = "trinity.tiers.v1";
export const RATINGS_KEY = "trinity.ratings.v1";

export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to persist", key, err);
  }
}

export function clear(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
