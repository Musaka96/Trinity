"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface ChatterRow {
  id: string;
  name: string;
  group: string;
  sales: number;
  unlockRate: number;
  cvr: number;
  dmsSent: number;
  modelsCount: number;
}

const columns: ColumnDef<ChatterRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Chatter",
    cell: ({ row }) => (
      <Link href={`/chatters/${encodeURIComponent(row.original.id)}`} className="group flex items-center gap-3">
        <Avatar name={row.original.name} size={34} />
        <div>
          <p className="font-medium text-primary transition-colors group-hover:text-accent">
            {row.original.name}
          </p>
          <p className="text-xs text-muted">{row.original.group}</p>
        </div>
      </Link>
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
    accessorKey: "cvr",
    header: "Fan CVR",
    cell: ({ row }) => <span className="tabular text-secondary">{row.original.cvr.toFixed(1)}%</span>,
  },
  {
    accessorKey: "dmsSent",
    header: "Messages",
    cell: ({ row }) => (
      <span className="tabular text-secondary">{formatNumber(row.original.dmsSent, { compact: true })}</span>
    ),
  },
  {
    accessorKey: "modelsCount",
    header: "Models",
    cell: ({ row }) => <Badge variant="outline">{row.original.modelsCount}</Badge>,
  },
  {
    id: "go",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/chatters/${encodeURIComponent(row.original.id)}`}
        className="inline-flex text-muted transition-colors hover:text-accent"
        aria-label="View chatter"
      >
        <ArrowUpRight className="size-4" />
      </Link>
    ),
  },
];

export function ChattersTable({ data }: { data: ChatterRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search chatters or teams…"
      globalFilterFn={(row, q) =>
        row.name.toLowerCase().includes(q) || row.group.toLowerCase().includes(q)
      }
    />
  );
}
