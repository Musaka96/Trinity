"use client";

import * as React from "react";
import { Check, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/store";
import { decimalDistribution, fmtCents, partitionMMPPV } from "@/lib/transactions";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export function MmppvSettings() {
  const { transactionsInRange, mmppvDecimals, setMmppvDecimals, isDemoTransactions } = useData();
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selected = new Set(mmppvDecimals);
  const dist = decimalDistribution(transactionsInRange).slice(0, 12);
  const { mmppv } = partitionMMPPV(transactionsInRange, mmppvDecimals);
  const excludedTotal = mmppv.reduce((a, t) => a + t.earnings, 0);

  async function commit(next: number[]) {
    setBusy(true);
    setError(null);
    const ok = await setMmppvDecimals(next);
    if (!ok) setError("Couldn't save. Try again.");
    setBusy(false);
  }

  const toggle = (cents: number) =>
    commit(selected.has(cents) ? mmppvDecimals.filter((c) => c !== cents) : [...mmppvDecimals, cents]);

  const addManual = () => {
    const n = parseInt(draft.replace(/[^\d]/g, ""), 10);
    if (Number.isInteger(n) && n >= 0 && n <= 99 && !selected.has(n)) commit([...mmppvDecimals, n]);
    setDraft("");
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>MMPPV / excluded decimals</CardTitle>
          <CardDescription>
            Sales whose cents match these are treated as MMPPV — excluded from chatter stats & totals, and
            counted as “Sales from MMPPV” on models.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {busy && <span className="text-xs text-muted">Saving…</span>}
          {error && <span className="text-xs text-critical">{error}</span>}
          <Badge variant={mmppvDecimals.length ? "accent" : "neutral"}>
            {mmppvDecimals.length ? `${formatCurrency(excludedTotal, { compact: true })} excluded` : "None set"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Selected chips + manual add */}
        <div className="flex flex-wrap items-center gap-2">
          {mmppvDecimals.length === 0 && (
            <span className="text-sm text-muted">No decimals excluded yet — pick from your data below.</span>
          )}
          {[...mmppvDecimals]
            .sort((a, b) => a - b)
            .map((c) => (
              <button
                key={c}
                onClick={() => toggle(c)}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
              >
                {fmtCents(c)}
                <X className="size-3" />
              </button>
            ))}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted">.</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
                inputMode="numeric"
                maxLength={2}
                placeholder="09"
                className="h-8 w-16 rounded-lg border border-border bg-surface-2 pl-5 pr-2 text-sm tabular text-primary focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={addManual}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Distribution from the actual data */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Decimals in your sales{isDemoTransactions ? " (demo data)" : ""}
          </p>
          {dist.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No transaction sales in the selected dates.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2/50 text-left text-xs text-muted">
                    <th className="px-4 py-2.5 font-medium">Decimal</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                    <th className="px-4 py-2.5 text-right font-medium">Sales</th>
                    <th className="px-4 py-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dist.map((d, i) => {
                    const on = selected.has(d.cents);
                    return (
                      <tr key={d.cents} className={cn(i % 2 === 1 && "bg-surface-1", on && "bg-[var(--accent-soft)]")}>
                        <td className="px-4 py-2.5 font-mono text-primary">{fmtCents(d.cents)}</td>
                        <td className="px-4 py-2.5 text-right tabular text-primary">{formatCurrency(d.total)}</td>
                        <td className="px-4 py-2.5 text-right tabular text-secondary">{formatNumber(d.count)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => toggle(d.cents)}
                            disabled={busy}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                              on
                                ? "border-transparent bg-accent text-white"
                                : "border-border text-secondary hover:bg-surface-2",
                            )}
                          >
                            {on ? (
                              <>
                                <Check className="size-3" /> MMPPV
                              </>
                            ) : (
                              "Exclude"
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
