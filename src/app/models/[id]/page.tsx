"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Megaphone, UserX } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ShiftChart } from "@/components/charts/shift-chart";
import { Leaderboard } from "@/components/leaderboard";
import { EventList } from "@/components/events-ui";
import { DateRangePicker } from "@/components/date-range-picker";
import { RankedList } from "@/components/ranked-list";
import { useData } from "@/lib/store";
import {
  chattersRanked,
  partitionMMPPV,
  partitionUnassigned,
  spendByShift,
  topSpenders,
  txnsForModel,
} from "@/lib/transactions";
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
import { formatCurrency } from "@/lib/utils";

export default function ModelDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id));
  const { rowsInRange, chatters, models, events, transactionsInRange, mmppvDecimals } = useData();

  const model = models.find((m) => m.id === id);
  const recs = rowsForModel(rowsInRange, id);
  const t = sumTotals(recs);

  const breakdown = modelChatterBreakdown(rowsInRange, id, chatters);

  // Transaction-level data (when present) gives real shift timing and spenders.
  const modelTxns = txnsForModel(transactionsInRange, id);
  const modelTxnTotal = modelTxns.reduce((a, t) => a + t.earnings, 0);
  const spenders = topSpenders(modelTxns, 10);

  // Sales with no assigned employee (subscriptions, tips) are tallied separately.
  const { assigned: assignedTxns, unassigned: unassignedTxns } = partitionUnassigned(modelTxns);
  const txnChatters = chattersRanked(assignedTxns, 10);
  const unassignedSales = unassignedTxns.reduce((a, t) => a + t.earnings, 0);
  const unassignedShare = modelTxnTotal ? (unassignedSales / modelTxnTotal) * 100 : 0;

  const { mmppv: modelMmppv } = partitionMMPPV(modelTxns, mmppvDecimals);
  const mmppvSales = modelMmppv.reduce((a, t) => a + t.earnings, 0);
  const mmppvShare = modelTxnTotal ? (mmppvSales / modelTxnTotal) * 100 : 0;
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
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/models"
          className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to models
        </Link>
        <DateRangePicker />
      </div>

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
              <CardDescription>
                {modelTxns.length ? "From sale timestamps · 04–12 · 12–20 · 20–04" : "Sales by shift"}
              </CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <ShiftChart data={modelTxns.length ? spendByShift(modelTxns) : salesByShift(recs)} />
          </div>
        </Card>
      </div>

      {modelTxns.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-accent">
                  <Megaphone className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-primary">Sales from MMPPV</p>
                  <p className="text-xs text-muted">
                    {mmppvDecimals.length
                      ? `Ending in ${mmppvDecimals.map((c) => `.${String(c).padStart(2, "0")}`).join(", ")}`
                      : "No decimals set"}
                    {" · "}
                    <Link href="/settings" className="text-accent hover:underline">
                      configure
                    </Link>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold tabular text-primary">{formatCurrency(mmppvSales)}</p>
                <p className="text-xs text-muted">{mmppvShare.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-surface-3 text-secondary">
                  <UserX className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-primary">Unassigned sales</p>
                  <p className="text-xs text-muted">
                    No chatter (subscriptions, tips) · {unassignedTxns.length} sales
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold tabular text-primary">{formatCurrency(unassignedSales)}</p>
                <p className="text-xs text-muted">{unassignedShare.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {modelTxns.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top spenders</CardTitle>
                <CardDescription>Fans ranked by spend on {model.name}</CardDescription>
              </div>
              <Link href="/fans" className="text-xs font-medium text-accent hover:underline">
                All fans →
              </Link>
            </CardHeader>
            <div className="p-3">
              <RankedList
                rows={spenders.map((s) => ({
                  id: s.fanId,
                  name: s.fanName,
                  subtitle: `${s.count} sales`,
                  total: s.total,
                  count: s.count,
                }))}
                hrefBase="/fans"
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Chatters by fan sales</CardTitle>
                <CardDescription>Who earned it, from the transaction feed</CardDescription>
              </div>
            </CardHeader>
            <div className="p-3">
              <RankedList rows={txnChatters} hrefBase="/chatters" />
            </div>
          </Card>
        </div>
      )}

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
