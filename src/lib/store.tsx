"use client";

import * as React from "react";
import seedJson from "@/data/seed.json";
import { Chatter, Dataset, Model, StatRow } from "./types";
import { deriveChatters, deriveModels, emptyDataset, importDiff, mergeDataset } from "./dataset";
import { TrinityEvent } from "./events";
import { EVENTS_KEY, IMPORTS_KEY, clear, load, save } from "./persistence";

const seed = seedJson as unknown as Dataset;

interface StoreValue {
  ready: boolean;
  dataset: Dataset; // seed merged with user imports
  chatters: Chatter[];
  models: Model[];
  events: TrinityEvent[];
  lastUpdated: string | null;
  importCount: number;

  importRows: (rows: StatRow[]) => { added: number; updated: number; dates: string[] };
  resetImports: () => void;

  addEvent: (ev: Omit<TrinityEvent, "id" | "createdAt">) => void;
  updateEvent: (ev: TrinityEvent) => void;
  deleteEvent: (id: string) => void;
}

const StoreContext = React.createContext<StoreValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // User imports (deltas), merged over the seed at read time.
  const [imports, setImports] = React.useState<Dataset>(emptyDataset());
  const [events, setEvents] = React.useState<TrinityEvent[]>([]);
  const [ready, setReady] = React.useState(false);

  // Hydrate from localStorage after mount (SSR renders seed-only, matching
  // the client's first paint, so there is no hydration mismatch).
  React.useEffect(() => {
    setImports(load<Dataset>(IMPORTS_KEY, emptyDataset()));
    setEvents(load<TrinityEvent[]>(EVENTS_KEY, []));
    setReady(true);
  }, []);

  const dataset = React.useMemo(() => mergeDataset(seed, imports.rows), [imports]);
  const chatters = React.useMemo(() => deriveChatters(dataset.rows), [dataset]);
  const models = React.useMemo(() => deriveModels(dataset.rows), [dataset]);

  const lastUpdated = imports.updatedAt ?? seed.updatedAt;

  const importRows = React.useCallback(
    (rows: StatRow[]) => {
      const diff = importDiff(imports, rows);
      setImports((prev) => {
        const next = mergeDataset(prev, rows);
        save(IMPORTS_KEY, next);
        return next;
      });
      return diff;
    },
    [imports],
  );

  const resetImports = React.useCallback(() => {
    clear(IMPORTS_KEY);
    setImports(emptyDataset());
  }, []);

  const persistEvents = React.useCallback((next: TrinityEvent[]) => {
    setEvents(next);
    save(EVENTS_KEY, next);
  }, []);

  const addEvent = React.useCallback(
    (ev: Omit<TrinityEvent, "id" | "createdAt">) => {
      const full: TrinityEvent = {
        ...ev,
        id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      persistEvents([full, ...events]);
    },
    [events, persistEvents],
  );

  const updateEvent = React.useCallback(
    (ev: TrinityEvent) => persistEvents(events.map((e) => (e.id === ev.id ? ev : e))),
    [events, persistEvents],
  );

  const deleteEvent = React.useCallback(
    (id: string) => persistEvents(events.filter((e) => e.id !== id)),
    [events, persistEvents],
  );

  const value: StoreValue = {
    ready,
    dataset,
    chatters,
    models,
    events,
    lastUpdated,
    importCount: imports.rows.length,
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
