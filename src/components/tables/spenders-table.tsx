"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SpenderRow } from "@/lib/transactions";
import { SpendTier, tierFor } from "@/lib/tiers";
import { TierBadge } from "@/components/tier-badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

const makeColumns = (tiers: SpendTier[]): ColumnDef<SpenderRow, unknown>[] => [
  {
    accessorKey: "fanName",
    header: "Fan",
    cell: ({ row }) => (
      <Link href={`/fans/${encodeURIComponent(row.original.fanId)}`} className="group flex items-center gap-3">
        <Avatar name={row.original.fanName} size={32} />
        <div className="min-w-0">
          <p className="truncate font-medium text-primary transition-colors group-hover:text-accent">
            {row.original.fanName}
          </p>
          <p className="truncate text-xs text-muted">{row.original.topModel}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "total",
    header: "Total spent",
    cell: ({ row }) => (
      <span className="font-medium tabular text-primary">{formatCurrency(row.original.total)}</span>
    ),
  },
  {
    id: "tier",
    header: "Tag",
    accessorFn: (r) => tierFor(r.total, tiers)?.label ?? "",
    cell: ({ row }) => <TierBadge tier={tierFor(row.original.total, tiers)} />,
  },
  {
    accessorKey: "count",
    header: "Sales",
    cell: ({ row }) => <span className="tabular text-secondary">{formatNumber(row.original.count)}</span>,
  },
  {
    accessorKey: "avg",
    header: "Avg sale",
    cell: ({ row }) => <span className="tabular text-secondary">{formatCurrency(row.original.avg)}</span>,
  },
  {
    accessorKey: "models",
    header: "Models",
    cell: ({ row }) => <Badge variant="outline">{row.original.models}</Badge>,
  },
  {
    accessorKey: "lastAt",
    header: "Last purchase",
    cell: ({ row }) => <span className="tabular text-secondary">{fmtWhen(row.original.lastAt)}</span>,
  },
  {
    id: "go",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/fans/${encodeURIComponent(row.original.fanId)}`}
        className="inline-flex text-muted transition-colors hover:text-accent"
        aria-label="Inspect spender"
      >
        <ArrowUpRight className="size-4" />
      </Link>
    ),
  },
];

export function SpendersTable({ data, tiers }: { data: SpenderRow[]; tiers: SpendTier[] }) {
  const columns = React.useMemo(() => makeColumns(tiers), [tiers]);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search fans…"
      globalFilterFn={(row, q) =>
        row.fanName.toLowerCase().includes(q) || row.topModel.toLowerCase().includes(q)
      }
    />
  );
}
