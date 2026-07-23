import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModelsTable, ModelRow } from "@/components/tables/models-table";
import {
  allModels,
  recordsForModel,
  recordsInLastDays,
  sumTotals,
} from "@/lib/analytics";

export const metadata: Metadata = { title: "Models" };

export default function ModelsPage() {
  const last30 = recordsInLastDays(30);

  const rows: ModelRow[] = allModels.map((m) => {
    const recs = recordsForModel(m.id, last30);
    const t = sumTotals(recs);
    const chatters = new Set(recs.map((r) => r.chatterId));
    return {
      id: m.id,
      name: m.name,
      handle: m.handle,
      avatar: m.avatar,
      platform: m.platform,
      status: m.status,
      subscribers: m.subscribers,
      net: t.net,
      unlockRate: t.ppvSent ? (t.ppvUnlocked / t.ppvSent) * 100 : 0,
      chattersCount: chatters.size,
    };
  });

  const active = rows.filter((r) => r.status === "active").length;

  return (
    <div>
      <PageHeader title="Models" description="Every model on the platform, with 30-day performance.">
        <Badge variant="neutral">{rows.length} total</Badge>
        <Badge variant="good">{active} active</Badge>
      </PageHeader>

      <Card className="p-4">
        <ModelsTable data={rows} />
      </Card>
    </div>
  );
}
