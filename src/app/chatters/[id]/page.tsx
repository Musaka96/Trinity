import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusDot } from "@/components/ui/badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ShiftChart } from "@/components/charts/shift-chart";
import { Leaderboard } from "@/components/leaderboard";
import {
  allChatters,
  chatterModelBreakdown,
  chatterShiftSplit,
  getChatter,
  recordsForChatter,
  revenueByDay,
  sumTotals,
} from "@/lib/analytics";

export function generateStaticParams() {
  return allChatters.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = getChatter(id);
  return { title: c ? c.name : "Chatter" };
}

export default async function ChatterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chatter = getChatter(id);
  if (!chatter) notFound();

  const recs = recordsForChatter(id);
  const t = sumTotals(recs);
  const unlockRate = t.ppvSent ? (t.ppvUnlocked / t.ppvSent) * 100 : 0;
  const breakdown = chatterModelBreakdown(id);

  const modelRows = breakdown.map(({ model, net }) => ({
    id: model.id,
    name: model.name,
    avatar: model.avatar,
    subtitle: model.platform,
    net,
    ppvUnlocked: 0,
    messagesSent: 0,
    unlockRate: 0,
  }));

  return (
    <div>
      <Link
        href="/chatters"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to chatters
      </Link>

      <Card className="mb-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar src={chatter.avatar} name={chatter.name} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{chatter.name}</h1>
              <StatusDot status={chatter.status} />
            </div>
            <p className="mt-1 text-sm text-secondary">
              Team {chatter.team} · Hired {chatter.hiredAt}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {chatter.languages.map((l) => (
              <Badge key={l} variant="outline">
                {l}
              </Badge>
            ))}
            {chatter.defaultShifts.map((s) => (
              <Badge key={s} variant="accent" className="capitalize">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Net revenue" value={t.net} icon="revenue" format="currency-compact" />
        <KpiCard index={1} label="Unlock rate" value={unlockRate} icon="percent" format="percent" />
        <KpiCard index={2} label="Messages sent" value={t.messagesSent} icon="messages" format="number-compact" />
        <KpiCard index={3} label="Models worked" value={breakdown.length} icon="sparkles" format="int" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue over time</CardTitle>
              <CardDescription>Daily net revenue for {chatter.name}</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <RevenueChart data={revenueByDay(recs)} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Shift split</CardTitle>
              <CardDescription>Revenue by shift</CardDescription>
            </div>
          </CardHeader>
          <div className="px-3 pb-4 pt-2">
            <ShiftChart data={chatterShiftSplit(id)} />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Models worked</CardTitle>
            <CardDescription>Revenue contribution per model</CardDescription>
          </div>
        </CardHeader>
        <div className="p-3">
          <Leaderboard rows={modelRows} hrefBase="/models" />
        </div>
      </Card>
    </div>
  );
}
