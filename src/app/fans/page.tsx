"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { SpendersTable } from "@/components/tables/spenders-table";
import { DateRangePicker } from "@/components/date-range-picker";
import { DemoDataNotice } from "@/components/demo-data-notice";
import { useData } from "@/lib/store";
import { topSpenders, txnTotals } from "@/lib/transactions";
import { cn } from "@/lib/utils";

type TierFilter = "all" | "whales" | "mid" | "small";

const TIERS: { id: TierFilter; label: string; hint: string }[] = [
  { id: "all", label: "All spenders", hint: "" },
  { id: "whales", label: "Whales", hint: "$500+" },
  { id: "mid", label: "Mid", hint: "$100–500" },
  { id: "small", label: "Small", hint: "< $100" },
];

export default function FansPage() {
  const { transactionsInRange, isDemoTransactions } = useData();
  const [tier, setTier] = React.useState<TierFilter>("all");

  const all = topSpenders(transactionsInRange);
  const totals = txnTotals(transactionsInRange);

  const rows = all.filter((r) =>
    tier === "whales" ? r.total >= 500 : tier === "mid" ? r.total >= 100 && r.total < 500 : tier === "small" ? r.total < 100 : true,
  );

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

      <div className="mt-4 flex flex-wrap gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTier(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
              tier === t.id
                ? "border-transparent bg-accent text-white"
                : "border-border text-secondary hover:bg-surface-2",
            )}
          >
            {t.label}
            {t.hint && <span className={cn("tabular", tier === t.id ? "text-white/70" : "text-muted")}>{t.hint}</span>}
          </button>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <SpendersTable data={rows} />
      </Card>
    </div>
  );
}
