"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusDot } from "@/components/ui/badge";
import { EntityStatus, Platform } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface ModelRow {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  platform: Platform;
  status: EntityStatus;
  subscribers: number;
  net: number;
  unlockRate: number;
  chattersCount: number;
}

const columns: ColumnDef<ModelRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Model",
    cell: ({ row }) => (
      <Link href={`/models/${row.original.id}`} className="group flex items-center gap-3">
        <Avatar src={row.original.avatar} name={row.original.name} size={34} />
        <div>
          <p className="font-medium text-primary transition-colors group-hover:text-accent">
            {row.original.name}
          </p>
          <p className="text-xs text-muted">{row.original.handle}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => <Badge variant="outline">{row.original.platform}</Badge>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusDot status={row.original.status} />,
  },
  {
    accessorKey: "subscribers",
    header: "Subscribers",
    cell: ({ row }) => (
      <span className="tabular text-secondary">
        {formatNumber(row.original.subscribers, { compact: true })}
      </span>
    ),
  },
  {
    accessorKey: "net",
    header: "Net revenue",
    cell: ({ row }) => (
      <span className="font-medium tabular text-primary">{formatCurrency(row.original.net)}</span>
    ),
  },
  {
    accessorKey: "unlockRate",
    header: "Unlock rate",
    cell: ({ row }) => (
      <span className="tabular text-secondary">{row.original.unlockRate.toFixed(1)}%</span>
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
        href={`/models/${row.original.id}`}
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
      searchPlaceholder="Search models or handles…"
      globalFilterFn={(row, q) =>
        row.name.toLowerCase().includes(q) ||
        row.handle.toLowerCase().includes(q) ||
        row.platform.toLowerCase().includes(q)
      }
    />
  );
}
