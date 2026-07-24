"use client";

import * as React from "react";
import seedJson from "@/data/seed.json";
import { Chatter, Dataset, Model, StatRow, Transaction } from "./types";
import { deriveChatters, deriveModels, emptyDataset, importDiff, mergeDataset } from "./dataset";
import { TrinityEvent } from "./events";
import { generateDemoTransactions } from "./demo-transactions";
import { DEFAULT_TIERS, SpendTier } from "./tiers";
import {
  ChatterRating,
  chatterIdFromRatingKey,
  isRatingKey,
  normalizeRating,
  ratingKey,
} from "./ratings";
import {
  EVENTS_KEY,
  IMPORTS_KEY,
  MMPPV_KEY,
  RATINGS_KEY,
  TIERS_KEY,
  TXNS_KEY,
  clear,
  load,
  save,
} from "./persistence";
import {
  fetchServerData,
  serverCreateEvent,
  serverDeleteEvent,
  serverImport,
  serverImportTransactions,
  serverReset,
  serverSaveSetting,
  serverUpdateEvent,
} from "./api";

const TIERS_SETTING = "spend_tiers";
const MMPPV_SETTING = "mmppv_decimals";

const seed = seedJson as unknown as Dataset;

export type StorageMode = "loading" | "server" | "local";

export interface DateRange {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
}

interface StoreValue {
  ready: boolean;
  mode: StorageMode;
  dataset: Dataset;
  chatters: Chatter[];
  models: Model[];
  events: TrinityEvent[];
  lastUpdated: string | null;
  importCount: number;

  /** Active date filter. null = all dates. */
  range: DateRange | null;
  /** Min/max dates present in the data. null when there is no data. */
  bounds: DateRange | null;
  /** dataset.rows filtered by the active range. */
  rowsInRange: StatRow[];
  setRange: (range: DateRange | null) => void;

  /** Transaction-level sales (fan payments). Demo data until a real import. */
  transactions: Transaction[];
  transactionsInRange: Transaction[];
  /** True while showing generated demo transactions (no real import yet). */
  isDemoTransactions: boolean;
  importTransactions: (txns: Transaction[]) => Promise<{ added: number; updated: number; dates: string[] }>;

  /** User-configurable spend tiers used to tag fans. */
  spendTiers: SpendTier[];
  /** Resolves false when the write could not be persisted. */
  setSpendTiers: (tiers: SpendTier[]) => Promise<boolean>;

  /** Manual skill assessments, keyed by chatter id. */
  ratings: Record<string, ChatterRating>;
  /** Resolves false when the write could not be persisted. */
  setRating: (rating: ChatterRating) => Promise<boolean>;

  /** Cents (0–99) that mark a sale as MMPPV: excluded from chatter stats. */
  mmppvDecimals: number[];
  setMmppvDecimals: (decimals: number[]) => Promise<boolean>;

  importRows: (rows: StatRow[]) => Promise<{ added: number; updated: number; dates: string[] }>;
  resetImports: () => Promise<void>;

  addEvent: (ev: Omit<TrinityEvent, "id" | "createdAt">) => Promise<void>;
  updateEvent: (ev: TrinityEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const StoreContext = React.createContext<StoreValue | null>(null);

/** Defensive: a settings value may arrive as a JSON string; parse it if so. */
function coerceValue(value: unknown): unknown {
  let v = value;
  for (let i = 0; i < 3 && typeof v === "string"; i++) {
    const s = v.trim();
    if (s[0] !== "{" && s[0] !== "[") break;
    try {
      v = JSON.parse(s);
    } catch {
      break;
    }
  }
  return v;
}

function newEvent(ev: Omit<TrinityEvent, "id" | "createdAt">): TrinityEvent {
  return {
    ...ev,
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<StorageMode>("loading");
  const [ready, setReady] = React.useState(false);

  // Server-backed data (used when a database is configured).
  const [server, setServer] = React.useState<{
    rows: StatRow[];
    events: TrinityEvent[];
    transactions: Transaction[];
    settings: Record<string, unknown>;
  }>({ rows: seed.rows, events: [], transactions: [], settings: {} });

  // Local fallback (browser persistence).
  const [imports, setImports] = React.useState<Dataset>(emptyDataset());
  const [localEvents, setLocalEvents] = React.useState<TrinityEvent[]>([]);
  const [localTxns, setLocalTxns] = React.useState<Transaction[]>([]);
  const [localTiers, setLocalTiers] = React.useState<SpendTier[]>(DEFAULT_TIERS);
  const [localRatings, setLocalRatings] = React.useState<Record<string, ChatterRating>>({});
  const [localMmppv, setLocalMmppv] = React.useState<number[]>([]);

  /**
   * Mode has to be settled before any write, otherwise a save fired while the
   * initial fetch is still in flight would land in localStorage and then be
   * invisible once we switch to the shared database. Writers await `initRef`.
   *
   * The deferred is created synchronously (pure — no state update), and the
   * effect below resolves it after the initial load, so the actual fetch and
   * its setState calls run in an effect rather than during render.
   */
  const modeRef = React.useRef<StorageMode>("loading");
  const initRef = React.useRef<{ promise: Promise<boolean>; resolve: (v: boolean) => void } | null>(null);
  if (initRef.current === null) {
    let resolve!: (v: boolean) => void;
    const promise = new Promise<boolean>((r) => (resolve = r));
    initRef.current = { promise, resolve };
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchServerData();
      if (cancelled) return;
      if (data) {
        setServer(data);
        modeRef.current = "server";
        setMode("server");
      } else {
        setImports(load<Dataset>(IMPORTS_KEY, emptyDataset()));
        setLocalEvents(load<TrinityEvent[]>(EVENTS_KEY, []));
        setLocalTxns(load<Transaction[]>(TXNS_KEY, []));
        setLocalTiers(load<SpendTier[]>(TIERS_KEY, DEFAULT_TIERS));
        setLocalRatings(load<Record<string, ChatterRating>>(RATINGS_KEY, {}));
        setLocalMmppv(load<number[]>(MMPPV_KEY, []));
        modeRef.current = "local";
        setMode("local");
      }
      setReady(true);
      initRef.current?.resolve(modeRef.current === "server");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Resolves to true when the shared database is the active target. */
  const resolveServerMode = React.useCallback(async () => {
    if (modeRef.current !== "loading") return modeRef.current === "server";
    return (await initRef.current?.promise) ?? false;
  }, []);

  const isServer = mode === "server";

  const dataset = React.useMemo(
    () => (isServer ? { rows: server.rows, updatedAt: null } : mergeDataset(seed, imports.rows)),
    [isServer, server.rows, imports],
  );
  const events = isServer ? server.events : localEvents;
  const chatters = React.useMemo(() => deriveChatters(dataset.rows), [dataset]);
  const models = React.useMemo(() => deriveModels(dataset.rows), [dataset]);
  const lastUpdated = isServer ? null : imports.updatedAt ?? seed.updatedAt;
  const importCount = isServer ? server.rows.length : imports.rows.length;

  const [range, setRange] = React.useState<DateRange | null>(null);

  const bounds = React.useMemo<DateRange | null>(() => {
    let min: string | null = null;
    let max: string | null = null;
    for (const r of dataset.rows) {
      if (min === null || r.date < min) min = r.date;
      if (max === null || r.date > max) max = r.date;
    }
    return min && max ? { from: min, to: max } : null;
  }, [dataset]);

  const rowsInRange = React.useMemo(
    () => (range ? dataset.rows.filter((r) => r.date >= range.from && r.date <= range.to) : dataset.rows),
    [dataset, range],
  );

  // ---- Transactions (fan-level sales) -------------------------------------
  const realTxns = isServer ? server.transactions : localTxns;

  // Demo set, generated only while no real transactions exist. Ordering the
  // entities by real sales makes the fake traffic mirror actual dominance.
  const demoTxns = React.useMemo(() => {
    if (realTxns.length) return [];
    const byChatter = new Map<string, number>();
    const byModel = new Map<string, number>();
    for (const r of dataset.rows) {
      byChatter.set(r.chatterId, (byChatter.get(r.chatterId) ?? 0) + r.sales);
      byModel.set(r.creator, (byModel.get(r.creator) ?? 0) + r.sales);
    }
    return generateDemoTransactions({
      chatters: [...chatters].sort((a, b) => (byChatter.get(b.id) ?? 0) - (byChatter.get(a.id) ?? 0)),
      models: [...models].sort((a, b) => (byModel.get(b.id) ?? 0) - (byModel.get(a.id) ?? 0)),
      dates: Array.from(new Set(dataset.rows.map((r) => r.date))).sort(),
    });
  }, [realTxns.length, chatters, models, dataset]);

  const transactions = realTxns.length ? realTxns : demoTxns;
  const isDemoTransactions = realTxns.length === 0 && demoTxns.length > 0;

  const transactionsInRange = React.useMemo(
    () => (range ? transactions.filter((t) => t.date >= range.from && t.date <= range.to) : transactions),
    [transactions, range],
  );

  // ---- Spend tiers --------------------------------------------------------
  const spendTiers = React.useMemo<SpendTier[]>(() => {
    if (isServer) {
      const fromServer = coerceValue(server.settings?.[TIERS_SETTING]);
      return Array.isArray(fromServer) && fromServer.length ? (fromServer as SpendTier[]) : DEFAULT_TIERS;
    }
    return localTiers.length ? localTiers : DEFAULT_TIERS;
  }, [isServer, server.settings, localTiers]);

  // Ratings live as one settings row per chatter ("rating:<id>"), so two people
  // rating different chatters never overwrite each other.
  const ratings = React.useMemo<Record<string, ChatterRating>>(() => {
    const raw: Record<string, ChatterRating> = {};
    if (isServer) {
      for (const [key, value] of Object.entries(server.settings ?? {})) {
        const parsed = coerceValue(value);
        if (isRatingKey(key) && parsed && typeof parsed === "object") {
          raw[chatterIdFromRatingKey(key)] = parsed as ChatterRating;
        }
      }
    } else {
      Object.assign(raw, localRatings);
    }
    const out: Record<string, ChatterRating> = {};
    for (const [id, r] of Object.entries(raw)) out[id] = normalizeRating(r);
    return out;
  }, [isServer, server.settings, localRatings]);

  const mmppvDecimals = React.useMemo<number[]>(() => {
    const raw = isServer ? coerceValue(server.settings?.[MMPPV_SETTING]) : localMmppv;
    return Array.isArray(raw) ? (raw as number[]).filter((n) => Number.isInteger(n) && n >= 0 && n <= 99) : [];
  }, [isServer, server.settings, localMmppv]);

  const refetch = React.useCallback(async () => {
    const data = await fetchServerData();
    if (data) setServer(data);
  }, []);

  const importRows = React.useCallback(
    async (rows: StatRow[]) => {
      if (isServer) {
        const diff = await serverImport(rows);
        await refetch();
        return diff ?? { added: 0, updated: 0, dates: [] };
      }
      const diff = importDiff(imports, rows);
      setImports((prev) => {
        const next = mergeDataset(prev, rows);
        save(IMPORTS_KEY, next);
        return next;
      });
      return diff;
    },
    [isServer, imports, refetch],
  );

  const importTransactions = React.useCallback(
    async (txns: Transaction[]) => {
      if (isServer) {
        const diff = await serverImportTransactions(txns);
        await refetch();
        return diff ?? { added: 0, updated: 0, dates: [] };
      }
      const existing = new Set(localTxns.map((t) => t.id));
      let added = 0;
      let updated = 0;
      for (const t of txns) (existing.has(t.id) ? updated++ : added++);
      const byId = new Map(localTxns.map((t) => [t.id, t] as const));
      for (const t of txns) byId.set(t.id, t);
      const next = Array.from(byId.values()).sort((a, b) => b.datetime.localeCompare(a.datetime));
      setLocalTxns(next);
      save(TXNS_KEY, next);
      return { added, updated, dates: Array.from(new Set(txns.map((t) => t.date))).sort() };
    },
    [isServer, localTxns, refetch],
  );

  const setSpendTiers = React.useCallback(
    async (tiers: SpendTier[]) => {
      const useServer = await resolveServerMode();
      if (useServer) {
        const okRes = await serverSaveSetting(TIERS_SETTING, tiers);
        if (!okRes) {
          await refetch();
          return false;
        }
        setServer((s) => ({ ...s, settings: { ...s.settings, [TIERS_SETTING]: tiers } }));
        return true;
      }
      setLocalTiers(tiers);
      save(TIERS_KEY, tiers);
      return true;
    },
    [resolveServerMode, refetch],
  );

  const setMmppvDecimals = React.useCallback(
    async (decimals: number[]) => {
      const clean = Array.from(new Set(decimals.filter((n) => Number.isInteger(n) && n >= 0 && n <= 99))).sort(
        (a, b) => a - b,
      );
      const useServer = await resolveServerMode();
      if (useServer) {
        const okRes = await serverSaveSetting(MMPPV_SETTING, clean);
        if (!okRes) {
          await refetch();
          return false;
        }
        setServer((s) => ({ ...s, settings: { ...s.settings, [MMPPV_SETTING]: clean } }));
        return true;
      }
      setLocalMmppv(clean);
      save(MMPPV_KEY, clean);
      return true;
    },
    [resolveServerMode, refetch],
  );

  const setRating = React.useCallback(
    async (rating: ChatterRating) => {
      const next = { ...rating, updatedAt: new Date().toISOString() };
      const useServer = await resolveServerMode();
      if (useServer) {
        const okRes = await serverSaveSetting(ratingKey(next.chatterId), next);
        if (!okRes) {
          // Don't leave an optimistic value on screen that isn't stored.
          await refetch();
          return false;
        }
        setServer((s) => ({ ...s, settings: { ...s.settings, [ratingKey(next.chatterId)]: next } }));
        return true;
      }
      setLocalRatings((prev) => {
        const merged = { ...prev, [next.chatterId]: next };
        save(RATINGS_KEY, merged);
        return merged;
      });
      return true;
    },
    [resolveServerMode, refetch],
  );

  const resetImports = React.useCallback(async () => {
    if (isServer) {
      await serverReset();
      await refetch();
      return;
    }
    clear(IMPORTS_KEY);
    clear(TXNS_KEY);
    setImports(emptyDataset());
    setLocalTxns([]);
  }, [isServer, refetch]);

  const persistLocalEvents = React.useCallback((next: TrinityEvent[]) => {
    setLocalEvents(next);
    save(EVENTS_KEY, next);
  }, []);

  const addEvent = React.useCallback(
    async (ev: Omit<TrinityEvent, "id" | "createdAt">) => {
      const full = newEvent(ev);
      if (isServer) {
        setServer((s) => ({ ...s, events: [full, ...s.events] }));
        const okRes = await serverCreateEvent(full);
        if (!okRes) await refetch();
        return;
      }
      persistLocalEvents([full, ...localEvents]);
    },
    [isServer, localEvents, persistLocalEvents, refetch],
  );

  const updateEvent = React.useCallback(
    async (ev: TrinityEvent) => {
      if (isServer) {
        setServer((s) => ({ ...s, events: s.events.map((e) => (e.id === ev.id ? ev : e)) }));
        const okRes = await serverUpdateEvent(ev);
        if (!okRes) await refetch();
        return;
      }
      persistLocalEvents(localEvents.map((e) => (e.id === ev.id ? ev : e)));
    },
    [isServer, localEvents, persistLocalEvents, refetch],
  );

  const deleteEvent = React.useCallback(
    async (id: string) => {
      if (isServer) {
        setServer((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
        const okRes = await serverDeleteEvent(id);
        if (!okRes) await refetch();
        return;
      }
      persistLocalEvents(localEvents.filter((e) => e.id !== id));
    },
    [isServer, localEvents, persistLocalEvents, refetch],
  );

  const value: StoreValue = {
    ready,
    mode,
    dataset,
    chatters,
    models,
    events,
    lastUpdated,
    importCount,
    range,
    bounds,
    rowsInRange,
    setRange,
    transactions,
    transactionsInRange,
    isDemoTransactions,
    importTransactions,
    spendTiers,
    setSpendTiers,
    ratings,
    setRating,
    mmppvDecimals,
    setMmppvDecimals,
    importRows,
    resetImports,
    addEvent,
    updateEvent,
    deleteEvent,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useData(): StoreValue {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
