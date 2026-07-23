"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "@/components/ui/avatar";
import { LeaderRow } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

export function Leaderboard({
  rows,
  hrefBase,
}: {
  rows: LeaderRow[];
  hrefBase: string;
}) {
  const max = Math.max(...rows.map((r) => r.net), 1);
  return (
    <div className="flex flex-col">
      {rows.map((row, i) => (
        <Link
          key={row.id}
          href={`${hrefBase}/${row.id}`}
          className="group relative flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2"
        >
          <span className="w-5 text-center text-xs font-medium text-muted tabular">{i + 1}</span>
          <Avatar src={row.avatar} name={row.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-primary">{row.name}</p>
              <p className="shrink-0 text-sm font-semibold text-primary tabular">
                {formatCurrency(row.net)}
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--accent)" }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(row.net / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="shrink-0 text-[11px] text-muted">{row.subtitle}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
