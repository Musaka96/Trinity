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
import { RankedList } from "@/components/ranked-list";
import { DateRangePicker } from "@/components/date-range-picker";
import { DemoDataNotice } from "@/components/demo-data-notice";
import { useData } from "@/lib/store";
import {
  chattersRanked,
  modelsRanked,
  spendByDay,
  spendByShift,
  txnTotals,
  txnsForFan,
} from "@/lib/transactions";
import { formatCurrency } from "@/lib/utils";

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export default function FanDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id));
  const { transactionsInRange, transactions, isDemoTransactions } = useData();

  const mine = txnsForFan(transactionsInRange, id);
  const everMine = txnsForFan(transactions, id);
  const t = txnTotals(mine);
  const fanName = (mine[0] ?? everMine[0])?.fanName ?? id;

  const recent = [...mine].sort((a, b) => b.datetime.localeCompare(a.datetime)).slice(0, 40);

  if (everMine.length === 0) {
    return (
      <div className="py-20 text-center text-muted">
        Fan not found.{" "}
        <Link href="/fans" className="text-accent hover:underline">
          Back to fans
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/fans"
          className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to fans
        </Link>
        <DateRangePicker />
      </div>

      {isDemoTransactions && <DemoDataNotice />}

      <Card className="mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar name={fanName} size={64} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{fanName}</h1>
            <p className="mt-1 text-sm text-secondary">
              {t.first ? `First seen ${fmtWhen(t.first)}` : "No purchases in range"}
              {t.last ? ` · Last ${fmtWhen(t.last)}` : ""}
            </p>
          </div>
          <Badge variant={t.total >= 500 ? "accent" : "outline"}>
            {t.total >= 500 ? "Whale" : t.total >= 100 ? "Mid spender" : "Small spender"}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Total spent" value={t.total} icon="revenue" format="currency-compact" />
        <KpiCard index={1} label="Purchases" value={t.count} icon="messages" format="int" />
        <KpiCard index={2} label="Avg purchase" value={t.avg} icon="sparkles" format="currency-compact" />
        <KpiCard index={3} label="Models" value={modelsRanked(mine).length} icon="users" format="int" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Spend over time</CardTitle>
              <CardDescription>When {fanName} spends</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <RevenueChart data={spendByDay(mine)} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>By shift</CardTitle>
              <CardDescription>04–12 · 12–20 · 20–04</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <ShiftChart data={spendByShift(mine)} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Models</CardTitle>
              <CardDescription>Where the money goes</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <RankedList rows={modelsRanked(mine)} hrefBase="/models" />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Chatters</CardTitle>
              <CardDescription>Who closed the sales</CardDescription>
            </div>
          </CardHeader>
          <div className="p-3">
            <RankedList rows={chattersRanked(mine)} hrefBase="/chatters" />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Purchase history</CardTitle>
            <CardDescription>Most recent {recent.length} of {t.count}</CardDescription>
          </div>
        </CardHeader>
        <div className="p-4 pt-2">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50 text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">Model</th>
                  <th className="px-4 py-2.5 font-medium">Chatter</th>
                  <th className="px-4 py-2.5 font-medium">Shift</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((x, i) => (
                  <tr key={x.id} className={i % 2 ? "bg-surface-1" : ""}>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular text-secondary">{fmtWhen(x.datetime)}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/models/${encodeURIComponent(x.creator)}`} className="hover:text-accent">
                        {x.creator}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/chatters/${encodeURIComponent(x.chatterId)}`} className="hover:text-accent">
                        {x.chatterName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-muted">{x.shift}</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular text-primary">
                      {formatCurrency(x.earnings)}
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                      No purchases in the selected dates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
