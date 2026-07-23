"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "@/components/ui/avatar";
import { RankedRow } from "@/lib/transactions";
import { formatCurrency } from "@/lib/utils";

/** Ranked bars for transaction-derived rankings (spenders, chatters, models). */
export function RankedList({
  rows,
  hrefBase,
  emptyLabel = "Nothing in this period.",
}: {
  rows: RankedRow[];
  hrefBase?: string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="px-2 py-8 text-center text-sm text-muted">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="flex flex-col">
      {rows.map((row, i) => {
        const inner = (
          <>
            <span className="w-5 text-center text-xs font-medium text-muted tabular">{i + 1}</span>
            <Avatar name={row.name} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-primary">{row.name}</p>
                <p className="shrink-0 text-sm font-semibold text-primary tabular">
                  {formatCurrency(row.total)}
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--accent)" }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(row.total / max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="shrink-0 text-[11px] text-muted">{row.subtitle}</span>
              </div>
            </div>
          </>
        );

        const cls = "group relative flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2";
        return hrefBase ? (
          <Link key={row.id} href={`${hrefBase}/${encodeURIComponent(row.id)}`} className={cls}>
            {inner}
          </Link>
        ) : (
          <div key={row.id} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
