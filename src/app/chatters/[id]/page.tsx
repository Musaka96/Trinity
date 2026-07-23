"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ShiftChart } from "@/components/charts/shift-chart";
import { Leaderboard } from "@/components/leaderboard";
import { EventList } from "@/components/events-ui";
import { DateRangePicker } from "@/components/date-range-picker";
import { useData } from "@/lib/store";
import {
  availableDates,
  avgPerFan,
  chatterModelBreakdown,
  fanCVR,
  rowsForChatter,
  salesByDay,
  salesByShift,
  sumTotals,
  unlockRate,
} from "@/lib/analytics";
import { EVENT_META, eventDates, eventsForChatter } from "@/lib/events";

export default function ChatterDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id));
  const { rowsInRange, chatters, models, events } = useData();

  const chatter = chatters.find((c) => c.id === id);
  const recs = rowsForChatter(rowsInRange, id);
  const t = sumTotals(recs);

  const breakdown = chatterModelBreakdown(rowsInRange, id, models);
  const modelRows = breakdown.map(({ model, net }) => ({
    id: model.id,
    name: model.name,
    subtitle: model.platform,
    net,
    unlockRate: 0,
    fansChatted: 0,
    dmsSent: 0,
  }));

  const chatterEvents = eventsForChatter(events, id);
  const markerMap = eventDates(chatterEvents, availableDates(recs));
  const markers = Array.from(markerMap.entries()).map(([date, evs]) => ({
    date,
    color: EVENT_META[evs[0].type].color,
    label: evs[0].title,
  }));

  if (!chatter) {
    return (
      <div className="py-20 text-center text-muted">
        Chatter not found.{" "}
        <Link href="/chatters" className="text-accent hover:underline">
          Back to chatters
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/chatters"
          className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to chatters
        </Link>
        <DateRangePicker />
      </div>

      <Card className="mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar name={chatter.name} size={64} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{chatter.name}</h1>
            <p className="mt-1 text-sm text-secondary">{chatter.group}</p>
          </div>
          <Badge variant="outline">{breakdown.length} models</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Sales" value={t.sales} icon="revenue" format="currency-compact" />
        <KpiCard index={1} label="Unlock rate" value={unlockRate(t)} icon="percent" format="percent" />
        <KpiCard index={2} label="Fan CVR" value={fanCVR(t)} icon="sparkles" format="percent" />
        <KpiCard index={3} label="Avg / paying fan" value={avgPerFan(t)} icon="users" format="currency-compact" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Sales over time</CardTitle>
              <CardDescription>Daily sales for {chatter.name}</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <RevenueChart data={salesByDay(recs)} markers={markers} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Shift split</CardTitle>
              <CardDescription>Sales by shift</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <ShiftChart data={salesByShift(recs)} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Models worked</CardTitle>
              <CardDescription>Sales contribution per model</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <Leaderboard rows={modelRows} hrefBase="/models" metric="none" />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Events & context</CardTitle>
              <CardDescription>Affecting this chatter</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <EventList
              events={chatterEvents}
              emptyLabel="No events affecting this chatter."
              scopeName={(ev) => (ev.modelId ? models.find((m) => m.id === ev.modelId)?.name ?? ev.modelId : "All models")}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
