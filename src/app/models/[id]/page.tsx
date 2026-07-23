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
import { useData } from "@/lib/store";
import {
  availableDates,
  avgPerFan,
  fanCVR,
  modelChatterBreakdown,
  rowsForModel,
  salesByDay,
  salesByShift,
  sumTotals,
  unlockRate,
} from "@/lib/analytics";
import { EVENT_META, eventDates, eventsForModel } from "@/lib/events";

export default function ModelDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id));
  const { dataset, chatters, models, events } = useData();

  const model = models.find((m) => m.id === id);
  const recs = rowsForModel(dataset.rows, id);
  const t = sumTotals(recs);

  const breakdown = modelChatterBreakdown(dataset.rows, id, chatters);
  const chatterRows = breakdown.map(({ chatter, net }) => ({
    id: chatter.id,
    name: chatter.name,
    subtitle: chatter.group,
    net,
    unlockRate: 0,
    fansChatted: 0,
    dmsSent: 0,
  }));

  const modelEvents = eventsForModel(events, id);
  const markerMap = eventDates(modelEvents, availableDates(recs));
  const markers = Array.from(markerMap.entries()).map(([date, evs]) => ({
    date,
    color: EVENT_META[evs[0].type].color,
    label: evs[0].title,
  }));

  if (!model) {
    return (
      <div className="py-20 text-center text-muted">
        Model not found.{" "}
        <Link href="/models" className="text-accent hover:underline">
          Back to models
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/models"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to models
      </Link>

      <Card className="mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar name={model.name} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{model.name}</h1>
              {model.tier !== "Standard" && (
                <Badge variant={model.tier === "VIP" ? "accent" : "neutral"}>{model.tier}</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-secondary">{model.platform}</p>
          </div>
          <Badge variant="outline">{breakdown.length} chatters</Badge>
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
              <CardDescription>Daily sales for {model.name}</CardDescription>
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
              <CardTitle>Chatters on this model</CardTitle>
              <CardDescription>Sales contribution per chatter</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <Leaderboard rows={chatterRows} hrefBase="/chatters" metric="none" />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Events & context</CardTitle>
              <CardDescription>Affecting this model</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <EventList
              events={modelEvents}
              emptyLabel="No events affecting this model."
              scopeName={(ev) => (ev.chatterId ? chatters.find((c) => c.id === ev.chatterId)?.name ?? ev.chatterId : null)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
