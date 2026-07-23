"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ShiftChart } from "@/components/charts/shift-chart";
import { Leaderboard } from "@/components/leaderboard";
import { Badge } from "@/components/ui/badge";
import { EventList } from "@/components/events-ui";
import { useData } from "@/lib/store";
import {
  availableDates,
  fanCVR,
  salesByDay,
  salesByShift,
  sumTotals,
  topChatters,
  topModels,
  unlockRate,
} from "@/lib/analytics";
import { EVENT_META, eventDates } from "@/lib/events";
import { formatCurrency, formatDateRange } from "@/lib/utils";

export default function DashboardPage() {
  const { dataset, chatters, models, events } = useData();
  const rows = dataset.rows;

  const totals = sumTotals(rows);
  const daily = salesByDay(rows);
  const dates = availableDates(rows);
  const spark = daily.map((d) => d.net);

  const markerMap = eventDates(events, dates);
  const markers = Array.from(markerMap.entries()).map(([date, evs]) => ({
    date,
    color: EVENT_META[evs[0].type].color,
    label: evs[0].title,
  }));

  const recentEvents = events.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Sales performance across all chatters, models, and shifts."
      >
        <Badge variant="accent">{formatDateRange(dates)}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Total sales" value={totals.sales} icon="revenue" format="currency-compact" spark={spark} />
        <KpiCard index={1} label="PPV unlock rate" value={unlockRate(totals)} icon="percent" format="percent" />
        <KpiCard index={2} label="Fan conversion" value={fanCVR(totals)} icon="sparkles" format="percent" />
        <KpiCard index={3} label="Messages sent" value={totals.dmsSent} icon="messages" format="number-compact" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Sales over time</CardTitle>
              <CardDescription>Daily sales · dots mark days with events</CardDescription>
            </div>
            <Badge variant="good">{formatCurrency(totals.sales, { compact: true })} total</Badge>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <RevenueChart data={daily} markers={markers} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sales by shift</CardTitle>
              <CardDescription>04–12 · 12–20 · 20–04</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <ShiftChart data={salesByShift(rows)} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top chatters</CardTitle>
              <CardDescription>Ranked by sales</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <Leaderboard rows={topChatters(rows, chatters)} hrefBase="/chatters" metric="unlock" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top models</CardTitle>
              <CardDescription>Ranked by sales</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <Leaderboard rows={topModels(rows, models)} hrefBase="/models" metric="unlock" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Context & events</CardTitle>
              <CardDescription>Promotions, takeovers, holidays…</CardDescription>
            </div>
            <Link href="/events" className="text-xs font-medium text-accent hover:underline">
              Manage →
            </Link>
          </CardHeader>
          <div className="p-3">
            <EventList
              events={recentEvents}
              emptyLabel="No events yet — add promotions, takeovers, bad days or holidays on the Events page."
              scopeName={(ev) => {
                const parts: string[] = [];
                if (ev.modelId) parts.push(models.find((m) => m.id === ev.modelId)?.name ?? ev.modelId);
                if (ev.chatterId) parts.push(chatters.find((c) => c.id === ev.chatterId)?.name ?? ev.chatterId);
                return parts.join(" · ") || "All models";
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
