"use client";

import * as React from "react";
import seedJson from "@/data/seed.json";
import { Chatter, Dataset, Model, StatRow, Transaction } from "./types";
import { deriveChatters, deriveModels, emptyDataset, importDiff, mergeDataset } from "./dataset";
import { TrinityEvent } from "./events";
import { generateDemoTransactions } from "./demo-transactions";
import { DEFAULT_TIERS, SpendTier } from "./tiers";
import { EVENTS_KEY, IMPORTS_KEY, TIERS_KEY, TXNS_KEY, clear, load, save } from "./persistence";
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
  setSpendTiers: (tiers: SpendTier[]) => Promise<void>;

  importRows: (rows: StatRow[]) => Promise<{ added: number; updated: number; dates: string[] }>;
  resetImports: () => Promise<void>;

  addEvent: (ev: Omit<TrinityEvent, "id" | "createdAt">) => Promise<void>;
  updateEvent: (ev: TrinityEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const StoreContext = React.createContext<StoreValue | null>(null);

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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchServerData();
      if (cancelled) return;
      if (data) {
        setServer(data);
        setMode("server");
      } else {
        setImports(load<Dataset>(IMPORTS_KEY, emptyDataset()));
        setLocalEvents(load<TrinityEvent[]>(EVENTS_KEY, []));
        setLocalTxns(load<Transaction[]>(TXNS_KEY, []));
        setLocalTiers(load<SpendTier[]>(TIERS_KEY, DEFAULT_TIERS));
        setMode("local");
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
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
      const fromServer = server.settings?.[TIERS_SETTING];
      return Array.isArray(fromServer) && fromServer.length ? (fromServer as SpendTier[]) : DEFAULT_TIERS;
    }
    return localTiers.length ? localTiers : DEFAULT_TIERS;
  }, [isServer, server.settings, localTiers]);

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
      if (isServer) {
        setServer((s) => ({ ...s, settings: { ...s.settings, [TIERS_SETTING]: tiers } }));
        const okRes = await serverSaveSetting(TIERS_SETTING, tiers);
        if (!okRes) await refetch();
        return;
      }
      setLocalTiers(tiers);
      save(TIERS_KEY, tiers);
    },
    [isServer, refetch],
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
