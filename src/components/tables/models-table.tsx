"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Platform } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface ModelRow {
  id: string;
  name: string;
  platform: Platform;
  tier: "VIP" | "Free" | "Standard";
  sales: number;
  unlockRate: number;
  fansChatted: number;
  chattersCount: number;
}

const columns: ColumnDef<ModelRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Model",
    cell: ({ row }) => (
      <Link href={`/models/${encodeURIComponent(row.original.id)}`} className="group flex items-center gap-3">
        <Avatar name={row.original.name} size={34} />
        <div>
          <p className="font-medium text-primary transition-colors group-hover:text-accent">
            {row.original.name}
          </p>
          <p className="text-xs text-muted">{row.original.platform}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) =>
      row.original.tier === "Standard" ? (
        <span className="text-muted">—</span>
      ) : (
        <Badge variant={row.original.tier === "VIP" ? "accent" : "neutral"}>{row.original.tier}</Badge>
      ),
  },
  {
    accessorKey: "sales",
    header: "Sales",
    cell: ({ row }) => (
      <span className="font-medium tabular text-primary">{formatCurrency(row.original.sales)}</span>
    ),
  },
  {
    accessorKey: "unlockRate",
    header: "Unlock rate",
    cell: ({ row }) => <span className="tabular text-secondary">{row.original.unlockRate.toFixed(1)}%</span>,
  },
  {
    accessorKey: "fansChatted",
    header: "Fans chatted",
    cell: ({ row }) => (
      <span className="tabular text-secondary">{formatNumber(row.original.fansChatted, { compact: true })}</span>
    ),
  },
  {
    accessorKey: "chattersCount",
    header: "Chatters",
    cell: ({ row }) => <Badge variant="outline">{row.original.chattersCount}</Badge>,
  },
  {
    id: "go",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/models/${encodeURIComponent(row.original.id)}`}
        className="inline-flex text-muted transition-colors hover:text-accent"
        aria-label="View model"
      >
        <ArrowUpRight className="size-4" />
      </Link>
    ),
  },
];

export function ModelsTable({ data }: { data: ModelRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search models or platforms…"
      globalFilterFn={(row, q) =>
        row.name.toLowerCase().includes(q) || row.platform.toLowerCase().includes(q)
      }
    />
  );
}
