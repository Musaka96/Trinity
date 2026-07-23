"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Sunrise, Sun, Moon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { BoardColumn } from "@/lib/analytics";

const SHIFT_META: Record<string, { icon: typeof Sun; color: string }> = {
  morning: { icon: Sunrise, color: "var(--series-4)" },
  afternoon: { icon: Sun, color: "var(--series-1)" },
  night: { icon: Moon, color: "var(--series-7)" },
};

export function ShiftBoard({ columns }: { columns: BoardColumn[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {columns.map((col, colIdx) => {
        const meta = SHIFT_META[col.shift.id];
        const Icon = meta.icon;
        return (
          <motion.div
            key={col.shift.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: colIdx * 0.08 }}
            className="flex flex-col rounded-[var(--radius-card)] border border-border bg-surface-1"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="grid size-9 place-items-center rounded-lg"
                  style={{ background: "var(--surface-2)", color: meta.color }}
                >
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{col.shift.label}</p>
                  <p className="text-xs text-muted">
                    {col.shift.start}–{col.shift.end}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular">{formatCurrency(col.net, { compact: true })}</p>
                <p className="text-xs text-muted">{col.assignments.length} on shift</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3">
              {col.assignments.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-muted">No one scheduled.</p>
              )}
              {col.assignments.map((a, i) => (
                <motion.div
                  key={a.chatter.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: colIdx * 0.08 + i * 0.03 }}
                  className="rounded-lg border border-border bg-surface-2/50 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Link href={`/chatters/${a.chatter.id}`}>
                      <Avatar src={a.chatter.avatar} name={a.chatter.name} size={32} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/chatters/${a.chatter.id}`}
                        className="truncate text-sm font-medium hover:text-accent"
                      >
                        {a.chatter.name}
                      </Link>
                      <p className="text-xs text-muted">Team {a.chatter.team}</p>
                    </div>
                    <span className="text-sm font-semibold tabular">{formatCurrency(a.net)}</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {a.models.map((m) => (
                      <Link key={m.model.id} href={`/models/${m.model.id}`}>
                        <Badge variant="neutral" className="hover:bg-surface-3">
                          {m.model.name.split(" ")[0]} · {formatCurrency(m.net, { compact: true })}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
