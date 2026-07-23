"use client";

import * as React from "react";
import seedJson from "@/data/seed.json";
import { Chatter, Dataset, Model, StatRow } from "./types";
import { deriveChatters, deriveModels, emptyDataset, importDiff, mergeDataset } from "./dataset";
import { TrinityEvent } from "./events";
import { EVENTS_KEY, IMPORTS_KEY, clear, load, save } from "./persistence";
import {
  fetchServerData,
  serverCreateEvent,
  serverDeleteEvent,
  serverImport,
  serverReset,
  serverUpdateEvent,
} from "./api";

const seed = seedJson as unknown as Dataset;

export type StorageMode = "loading" | "server" | "local";

interface StoreValue {
  ready: boolean;
  mode: StorageMode;
  dataset: Dataset;
  chatters: Chatter[];
  models: Model[];
  events: TrinityEvent[];
  lastUpdated: string | null;
  importCount: number;

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
  const [server, setServer] = React.useState<{ rows: StatRow[]; events: TrinityEvent[] }>({
    rows: seed.rows,
    events: [],
  });

  // Local fallback (browser persistence).
  const [imports, setImports] = React.useState<Dataset>(emptyDataset());
  const [localEvents, setLocalEvents] = React.useState<TrinityEvent[]>([]);

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

  const resetImports = React.useCallback(async () => {
    if (isServer) {
      await serverReset();
      await refetch();
      return;
    }
    clear(IMPORTS_KEY);
    setImports(emptyDataset());
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
