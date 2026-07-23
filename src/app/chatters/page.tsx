import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChattersTable, ChatterRow } from "@/components/tables/chatters-table";
import {
  allChatters,
  recordsForChatter,
  recordsInLastDays,
  sumTotals,
} from "@/lib/analytics";

export const metadata: Metadata = { title: "Chatters" };

export default function ChattersPage() {
  const last30 = recordsInLastDays(30);

  const rows: ChatterRow[] = allChatters.map((c) => {
    const recs = recordsForChatter(c.id, last30);
    const t = sumTotals(recs);
    const models = new Set(recs.map((r) => r.modelId));
    return {
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      team: c.team,
      status: c.status,
      languages: c.languages,
      net: t.net,
      unlockRate: t.ppvSent ? (t.ppvUnlocked / t.ppvSent) * 100 : 0,
      messagesSent: t.messagesSent,
      modelsCount: models.size,
    };
  });

  const active = rows.filter((r) => r.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Chatters"
        description="Everyone on the roster, with 30-day performance."
      >
        <Badge variant="neutral">{rows.length} total</Badge>
        <Badge variant="good">{active} active</Badge>
      </PageHeader>

      <Card className="p-4">
        <ChattersTable data={rows} />
      </Card>
    </div>
  );
}
