import { StatRow, Transaction } from "./types";
import { TrinityEvent } from "./events";

/**
 * Client wrappers around the /api routes. Every call returns null (or false)
 * when the backend is not configured or unreachable, so the store can fall
 * back to localStorage without throwing.
 */

export interface ServerData {
  rows: StatRow[];
  events: TrinityEvent[];
  transactions: Transaction[];
  settings: Record<string, unknown>;
}

export async function fetchServerData(): Promise<ServerData | null> {
  try {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.configured) return null;
    return {
      rows: json.rows ?? [],
      events: json.events ?? [],
      transactions: json.transactions ?? [],
      settings: json.settings ?? {},
    };
  } catch {
    return null;
  }
}

export interface ImportDiff {
  added: number;
  updated: number;
  dates: string[];
}

export async function serverImport(rows: StatRow[]): Promise<ImportDiff | null> {
  try {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return { added: json.added, updated: json.updated, dates: json.dates };
  } catch {
    return null;
  }
}

export async function serverImportTransactions(transactions: Transaction[]): Promise<ImportDiff | null> {
  try {
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transactions }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return { added: json.added, updated: json.updated, dates: json.dates };
  } catch {
    return null;
  }
}

export async function serverCreateEvent(ev: TrinityEvent): Promise<boolean> {
  return ok(
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ev),
    }),
  );
}

export async function serverUpdateEvent(ev: TrinityEvent): Promise<boolean> {
  return ok(
    fetch(`/api/events/${encodeURIComponent(ev.id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ev),
    }),
  );
}

export async function serverDeleteEvent(id: string): Promise<boolean> {
  return ok(fetch(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" }));
}

export async function serverSaveSetting(key: string, value: unknown): Promise<boolean> {
  return ok(
    fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, value }),
    }),
  );
}

export async function serverReset(): Promise<boolean> {
  return ok(fetch("/api/reset", { method: "POST" }));
}

async function ok(p: Promise<Response>): Promise<boolean> {
  try {
    return (await p).ok;
  } catch {
    return false;
  }
}
