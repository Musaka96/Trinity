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
  allModels,
  getModel,
  modelChatterBreakdown,
  modelShiftSplit,
  recordsForModel,
  revenueByDay,
  sumTotals,
} from "@/lib/analytics";
import { formatNumber } from "@/lib/utils";

export function generateStaticParams() {
  return allModels.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = getModel(id);
  return { title: m ? m.name : "Model" };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const model = getModel(id);
  if (!model) notFound();

  const recs = recordsForModel(id);
  const t = sumTotals(recs);
  const unlockRate = t.ppvSent ? (t.ppvUnlocked / t.ppvSent) * 100 : 0;
  const breakdown = modelChatterBreakdown(id);

  const chatterRows = breakdown.map(({ chatter, net }) => ({
    id: chatter.id,
    name: chatter.name,
    avatar: chatter.avatar,
    subtitle: `Team ${chatter.team}`,
    net,
    ppvUnlocked: 0,
    messagesSent: 0,
    unlockRate: 0,
  }));

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
          <Avatar src={model.avatar} name={model.name} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">{model.name}</h1>
              <StatusDot status={model.status} />
            </div>
            <p className="mt-1 text-sm text-secondary">
              {model.handle} · {model.platform} · {formatNumber(model.subscribers, { compact: true })} subscribers
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {model.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Net revenue" value={t.net} icon="revenue" format="currency-compact" />
        <KpiCard index={1} label="Unlock rate" value={unlockRate} icon="percent" format="percent" />
        <KpiCard index={2} label="Messages sent" value={t.messagesSent} icon="messages" format="number-compact" />
        <KpiCard index={3} label="Chatters" value={breakdown.length} icon="users" format="int" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue over time</CardTitle>
              <CardDescription>Daily net revenue for {model.name}</CardDescription>
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
            <ShiftChart data={modelShiftSplit(id)} />
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div>
            <CardTitle>Chatters on this model</CardTitle>
            <CardDescription>Revenue contribution per chatter</CardDescription>
          </div>
        </CardHeader>
        <div className="p-3">
          <Leaderboard rows={chatterRows} hrefBase="/chatters" />
        </div>
      </Card>
    </div>
  );
}
