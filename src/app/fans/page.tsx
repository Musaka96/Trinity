"use client";

import * as React from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { SpendersTable } from "@/components/tables/spenders-table";
import { DateRangePicker } from "@/components/date-range-picker";
import { DemoDataNotice } from "@/components/demo-data-notice";
import { useData } from "@/lib/store";
import { topSpenders, txnTotals } from "@/lib/transactions";
import { bucketByTier, sortTiers, tierFor, tierRangeLabel } from "@/lib/tiers";
import { cn } from "@/lib/utils";

export default function FansPage() {
  const { transactionsInRange, isDemoTransactions, spendTiers } = useData();
  const [active, setActive] = React.useState<string>("all");

  const tiers = sortTiers(spendTiers);
  const all = topSpenders(transactionsInRange);
  const totals = txnTotals(transactionsInRange);
  const buckets = bucketByTier(all, tiers);

  const rows = active === "all" ? all : all.filter((r) => tierFor(r.total, tiers)?.id === active);

  return (
    <div>
      <PageHeader title="Fans & spenders" description="Every fan who spent, ranked. Click one to inspect their history.">
        <Badge variant="neutral">{all.length} spenders</Badge>
        <DateRangePicker />
      </PageHeader>

      {isDemoTransactions && <DemoDataNotice />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Total spend" value={totals.total} icon="revenue" format="currency-compact" />
        <KpiCard index={1} label="Paying fans" value={totals.fans} icon="users" format="int" />
        <KpiCard index={2} label="Sales" value={totals.count} icon="messages" format="int" />
        <KpiCard index={3} label="Avg sale" value={totals.avg} icon="sparkles" format="currency-compact" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActive("all")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
            active === "all"
              ? "border-transparent bg-accent text-white"
              : "border-border text-secondary hover:bg-surface-2",
          )}
        >
          All spenders
          <span className={cn("tabular", active === "all" ? "text-white/70" : "text-muted")}>{all.length}</span>
        </button>

        {buckets.map((b) => {
          const on = active === b.tier.id;
          return (
            <button
              key={b.tier.id}
              onClick={() => setActive(b.tier.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                on ? "border-transparent text-white" : "border-border text-secondary hover:bg-surface-2",
              )}
              style={on ? { background: b.tier.color } : undefined}
            >
              <span className="size-1.5 rounded-full" style={{ background: on ? "#fff" : b.tier.color }} />
              {b.tier.label}
              <span className={cn("tabular", on ? "text-white/70" : "text-muted")}>
                {tierRangeLabel(b.tier, tiers)} · {b.count}
              </span>
            </button>
          );
        })}

        <Link
          href="/settings"
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent"
        >
          <Settings2 className="size-3.5" />
          Edit tags
        </Link>
      </div>

      <Card className="mt-4 p-4">
        <SpendersTable data={rows} tiers={tiers} />
      </Card>
    </div>
  );
}
