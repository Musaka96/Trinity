"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useData } from "@/lib/store";
import {
  availableDates,
  channelSplit,
  revenueComposition,
  salesByDay,
  salesByTier,
  sumTotals,
} from "@/lib/analytics";
import { EVENT_META, eventDates } from "@/lib/events";
import { formatCurrency, formatDateRange } from "@/lib/utils";

export default function AnalyticsPage() {
  const { dataset, events } = useData();
  const rows = dataset.rows;
  const totals = sumTotals(rows);
  const dates = availableDates(rows);

  const markerMap = eventDates(events, dates);
  const markers = Array.from(markerMap.entries()).map(([date, evs]) => ({
    date,
    color: EVENT_META[evs[0].type].color,
    label: evs[0].title,
  }));

  const tiers = salesByTier(rows);
  const maxTier = Math.max(...tiers.map((t) => t.value), 1);

  return (
    <div>
      <PageHeader title="Analytics" description="Where the revenue comes from — composition, channels, and tiers.">
        <Badge variant="accent">{formatDateRange(dates)}</Badge>
      </PageHeader>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sales over time</CardTitle>
            <CardDescription>Daily sales · dots mark days with events</CardDescription>
          </div>
        </CardHeader>
        <div className="px-3 pb-4 pt-2">
          <RevenueChart data={salesByDay(rows)} markers={markers} height={320} />
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue composition</CardTitle>
              <CardDescription>PPV sales vs tips</CardDescription>
            </div>
          </CardHeader>
          <div className="p-5 pt-2">
            <DonutChart data={revenueComposition(totals)} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>PPV channels</CardTitle>
              <CardDescription>How PPV sales were delivered</CardDescription>
            </div>
          </CardHeader>
          <div className="p-5 pt-2">
            <DonutChart data={channelSplit(totals)} />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Sales by account tier</CardTitle>
            <CardDescription>VIP vs Free vs standard accounts</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-col gap-4 p-5 pt-4">
          {tiers.map((t, i) => (
            <div key={t.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{t.label}</span>
                <span className="tabular font-semibold">{formatCurrency(t.value)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(t.value / maxTier) * 100}%`,
                    background: ["var(--series-1)", "var(--series-3)", "var(--series-7)"][i % 3],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
