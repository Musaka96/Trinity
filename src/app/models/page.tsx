"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModelsTable, ModelRow } from "@/components/tables/models-table";
import { DateRangePicker } from "@/components/date-range-picker";
import { useData } from "@/lib/store";
import { rowsForModel, sumTotals, unlockRate } from "@/lib/analytics";

export default function ModelsPage() {
  const { rowsInRange, models } = useData();
  const rows = rowsInRange;

  const data: ModelRow[] = models.map((m) => {
    const recs = rowsForModel(rows, m.id);
    const t = sumTotals(recs);
    return {
      id: m.id,
      name: m.name,
      platform: m.platform,
      tier: m.tier,
      sales: t.sales,
      unlockRate: unlockRate(t),
      fansChatted: t.fansChatted,
      chattersCount: new Set(recs.map((r) => r.chatterId)).size,
    };
  });

  return (
    <div>
      <PageHeader title="Models" description="Every creator on the platform, with performance for the selected dates.">
        <Badge variant="neutral">{data.length} models</Badge>
        <DateRangePicker />
      </PageHeader>
      <Card className="p-4">
        <ModelsTable data={data} />
      </Card>
    </div>
  );
}
