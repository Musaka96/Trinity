"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  MessagesSquare,
  Percent,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/animated-number";
import { cn, formatCurrency, formatNumber, formatPct } from "@/lib/utils";

export type KpiIcon = "revenue" | "percent" | "messages" | "users" | "sparkles";
export type KpiFormat = "currency-compact" | "percent" | "number-compact" | "int";

const ICONS: Record<KpiIcon, LucideIcon> = {
  revenue: DollarSign,
  percent: Percent,
  messages: MessagesSquare,
  users: Users,
  sparkles: Sparkles,
};

const FORMATTERS: Record<KpiFormat, (n: number) => string> = {
  "currency-compact": (n) => formatCurrency(n, { compact: true }),
  percent: (n) => `${n.toFixed(1)}%`,
  "number-compact": (n) => formatNumber(n, { compact: true }),
  int: (n) => formatNumber(Math.round(n)),
};

export interface KpiCardProps {
  label: string;
  value: number;
  changePct?: number;
  icon: KpiIcon;
  format: KpiFormat;
  spark?: number[];
  index?: number;
}

export function KpiCard({ label, value, changePct, icon, format, spark, index = 0 }: KpiCardProps) {
  const Icon = ICONS[icon];
  const fmt = FORMATTERS[format];
  const up = (changePct ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="group overflow-hidden p-5 transition-colors hover:border-border-strong">
        <div className="flex items-center justify-between">
          <span className="grid size-9 place-items-center rounded-lg bg-surface-2 text-accent">
            <Icon className="size-4" />
          </span>
          {changePct !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                up ? "bg-[var(--good-soft)] text-good" : "bg-[var(--critical-soft)] text-critical",
              )}
            >
              {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {formatPct(changePct)}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">
            <AnimatedNumber value={value} format={fmt} />
          </p>
        </div>
        {spark && <Sparkline data={spark} up={up} />}
      </Card>
    </motion.div>
  );
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 240;
  const h = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((d, i) => [i * step, h - ((d - min) / range) * h]);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const color = up ? "var(--good)" : "var(--critical)";
  const id = React.useId();

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-4 h-10 w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
