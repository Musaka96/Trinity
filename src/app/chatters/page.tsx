"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChattersTable, ChatterRow } from "@/components/tables/chatters-table";
import { DateRangePicker } from "@/components/date-range-picker";
import { useData } from "@/lib/store";
import { fanCVR, rowsForChatter, sumTotals, unlockRate } from "@/lib/analytics";
import { overallScore } from "@/lib/ratings";

export default function ChattersPage() {
  const { rowsInRange, chatters, ratings } = useData();
  const rows = rowsInRange;

  const data: ChatterRow[] = chatters.map((c) => {
    const recs = rowsForChatter(rows, c.id);
    const t = sumTotals(recs);
    return {
      id: c.id,
      name: c.name,
      group: c.group,
      sales: t.sales,
      unlockRate: unlockRate(t),
      cvr: fanCVR(t),
      dmsSent: t.dmsSent,
      modelsCount: new Set(recs.map((r) => r.creator)).size,
      rating: overallScore(ratings[c.id]),
    };
  });

  return (
    <div>
      <PageHeader title="Chatters" description="Everyone on the roster, with performance for the selected dates.">
        <Badge variant="neutral">{data.length} chatters</Badge>
        <DateRangePicker />
      </PageHeader>
      <Card className="p-4">
        <ChattersTable data={data} />
      </Card>
    </div>
  );
}
