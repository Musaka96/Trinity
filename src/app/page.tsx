import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ShiftChart } from "@/components/charts/shift-chart";
import { Leaderboard } from "@/components/leaderboard";
import { Badge } from "@/components/ui/badge";
import {
  allChatters,
  changePct,
  recordsInLastDays,
  revenueByDay,
  revenueByShift,
  sumTotals,
  topChatters,
  topModels,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const last30 = recordsInLastDays(30);
  const prev30 = recordsInLastDays(60).filter((r) => !last30.includes(r));

  const cur = sumTotals(last30);
  const prev = sumTotals(prev30);

  const unlockRate = cur.ppvSent ? (cur.ppvUnlocked / cur.ppvSent) * 100 : 0;
  const prevUnlock = prev.ppvSent ? (prev.ppvUnlocked / prev.ppvSent) * 100 : 0;

  const daily = revenueByDay(last30);
  const spark = daily.map((d) => d.net);
  const activeChatters = allChatters.filter((c) => c.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Performance across all chatters, models, and shifts — last 30 days."
      >
        <Badge variant="accent">Last 30 days</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Net revenue"
          value={cur.net}
          changePct={changePct(cur.net, prev.net)}
          icon="revenue"
          format="currency-compact"
          spark={spark}
        />
        <KpiCard
          index={1}
          label="PPV unlock rate"
          value={unlockRate}
          changePct={changePct(unlockRate, prevUnlock)}
          icon="percent"
          format="percent"
        />
        <KpiCard
          index={2}
          label="Messages sent"
          value={cur.messagesSent}
          changePct={changePct(cur.messagesSent, prev.messagesSent)}
          icon="messages"
          format="number-compact"
        />
        <KpiCard
          index={3}
          label="Active chatters"
          value={activeChatters}
          icon="users"
          format="int"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Net revenue over time</CardTitle>
              <CardDescription>Daily net revenue, all shifts combined</CardDescription>
            </div>
            <Badge variant="good">{formatCurrency(cur.net, { compact: true })} total</Badge>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <RevenueChart data={daily} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue by shift</CardTitle>
              <CardDescription>Where the money is made</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <ShiftChart data={revenueByShift(last30)} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top chatters</CardTitle>
              <CardDescription>Ranked by net revenue</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <Leaderboard rows={topChatters(last30)} hrefBase="/chatters" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top models</CardTitle>
              <CardDescription>Ranked by net revenue</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <Leaderboard rows={topModels(last30)} hrefBase="/models" />
          </div>
        </Card>
      </div>
    </div>
  );
}
