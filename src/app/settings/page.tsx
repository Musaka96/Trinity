"use client";

import * as React from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/tier-badge";
import { useData } from "@/lib/store";
import { topSpenders } from "@/lib/transactions";
import {
  DEFAULT_TIERS,
  SpendTier,
  TIER_COLORS,
  bucketByTier,
  newTierId,
  sortTiers,
  tierRangeLabel,
} from "@/lib/tiers";
import { cn, formatCurrency } from "@/lib/utils";

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-primary placeholder:text-muted focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]";

export default function SettingsPage() {
  const { spendTiers, setSpendTiers, transactionsInRange, mode } = useData();

  // Local draft so typing stays smooth; saved explicitly.
  const [draft, setDraft] = React.useState<SpendTier[]>(spendTiers);
  const [saved, setSaved] = React.useState(false);
  const dirtyRef = React.useRef(false);

  // Keep the draft in sync until the user starts editing.
  React.useEffect(() => {
    if (!dirtyRef.current) setDraft(spendTiers);
  }, [spendTiers]);

  const touch = (next: SpendTier[]) => {
    dirtyRef.current = true;
    setSaved(false);
    setDraft(next);
  };

  const update = (id: string, patch: Partial<SpendTier>) =>
    touch(draft.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const remove = (id: string) => touch(draft.filter((t) => t.id !== id));

  const add = () => {
    const highest = Math.max(...draft.map((t) => t.minTotal), 0);
    touch([
      ...draft,
      {
        id: newTierId(),
        label: "New tag",
        minTotal: highest + 500,
        color: TIER_COLORS[draft.length % TIER_COLORS.length],
      },
    ]);
  };

  const [error, setError] = React.useState<string | null>(null);

  const save = async () => {
    setError(null);
    const cleaned = draft
      .map((t) => ({ ...t, label: t.label.trim() || "Untitled", minTotal: Math.max(0, Number(t.minTotal) || 0) }))
      .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);
    const ok = await setSpendTiers(sortTiers(cleaned));
    if (ok) {
      dirtyRef.current = false;
      setSaved(true);
    } else {
      setError("Couldn't save to the database. Your changes are still here — try again.");
    }
  };

  const resetDefaults = async () => {
    dirtyRef.current = false;
    setDraft(DEFAULT_TIERS);
    await setSpendTiers(DEFAULT_TIERS);
    setSaved(true);
  };

  // Live preview against the current data.
  const spenders = topSpenders(transactionsInRange);
  const buckets = bucketByTier(spenders, sortTiers(draft));
  const hasZero = draft.some((t) => t.minTotal === 0);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Tune how fans are tagged by spend. Changes apply everywhere spenders appear."
      >
        <Badge variant={mode === "server" ? "good" : "neutral"}>
          {mode === "server" ? "Shared database" : "This browser only"}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Spend tags</CardTitle>
              <CardDescription>
                A fan gets the highest tag they qualify for. Keep one tag at $0 to catch everyone.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetDefaults}>
              <RotateCcw className="size-4" />
              Defaults
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {sortTiers(draft).map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-surface-2/40 p-3">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex min-w-[140px] flex-1 flex-col gap-1.5">
                    <span className="text-xs font-medium text-secondary">Tag name</span>
                    <input
                      className={inputCls}
                      value={t.label}
                      onChange={(e) => update(t.id, { label: e.target.value })}
                    />
                  </label>
                  <label className="flex w-32 flex-col gap-1.5">
                    <span className="text-xs font-medium text-secondary">Spend from</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        className={cn(inputCls, "pl-6 tabular")}
                        value={t.minTotal}
                        onChange={(e) => update(t.id, { minTotal: Number(e.target.value) })}
                      />
                    </div>
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-secondary">Colour</span>
                    <div className="flex flex-wrap gap-1">
                      {TIER_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => update(t.id, { color: c })}
                          aria-label={`Colour ${c}`}
                          className={cn(
                            "size-6 rounded-md border transition-transform",
                            t.color === c ? "scale-110 border-white/60" : "border-transparent hover:scale-105",
                          )}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(t.id)}
                    aria-label={`Delete ${t.label}`}
                    disabled={draft.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <TierBadge tier={t} />
                  <span className="text-xs text-muted">{tierRangeLabel(t, draft)}</span>
                </div>
              </div>
            ))}

            {!hasZero && (
              <p className="text-xs text-warning">
                No tag starts at $0 — fans below {formatCurrency(Math.min(...draft.map((t) => t.minTotal)))} will be
                untagged.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" onClick={add}>
                <Plus className="size-4" />
                Add tag
              </Button>
              <Button onClick={save}>Save changes</Button>
              {saved && <span className="self-center text-xs text-good">Saved</span>}
              {error && <span className="self-center text-xs text-critical">{error}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How your fans fall into these tags right now</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {spenders.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">No spender data in the selected dates.</p>
            )}
            {buckets.map((b) => {
              const pct = spenders.length ? (b.count / spenders.length) * 100 : 0;
              return (
                <div key={b.tier.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <TierBadge tier={b.tier} />
                    <span className="tabular text-secondary">
                      {b.count} fans · {formatCurrency(b.total, { compact: true })}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: b.tier.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
