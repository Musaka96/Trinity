import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StackedShiftChart } from "@/components/charts/stacked-shift-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import {
  recordsInLastDays,
  revenueByDay,
  revenueByPlatform,
  revenueByTeam,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const last30 = recordsInLastDays(30);
  const daily = revenueByDay(last30);
  const platforms = revenueByPlatform(last30);
  const teams = revenueByTeam(last30);
  const maxTeam = Math.max(...teams.map((t) => t.net), 1);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Revenue composition across shifts, platforms, and teams."
      >
        <Badge variant="accent">Last 30 days</Badge>
      </PageHeader>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Revenue composition by shift</CardTitle>
            <CardDescription>Stacked daily net revenue across the three shifts</CardDescription>
          </div>
        </CardHeader>
        <div className="p-4 pt-2">
          <StackedShiftChart data={daily} />
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue by platform</CardTitle>
              <CardDescription>Where subscribers convert</CardDescription>
            </div>
          </CardHeader>
          <div className="p-5 pt-2">
            <DonutChart data={platforms.map((p) => ({ label: p.platform, value: p.net }))} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Team performance</CardTitle>
              <CardDescription>Net revenue by chatter team</CardDescription>
            </div>
          </CardHeader>
          <div className="flex flex-col gap-4 p-5 pt-4">
            {teams.map((t, i) => (
              <div key={t.team}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">Team {t.team}</span>
                  <span className="tabular font-semibold">{formatCurrency(t.net)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(t.net / maxTeam) * 100}%`,
                      background: ["var(--series-1)", "var(--series-3)", "var(--series-7)"][i % 3],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
