"use client";

import * as React from "react";
import { Database, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Importer } from "@/components/importer";
import { useData } from "@/lib/store";
import { availableDates } from "@/lib/analytics";
import { formatDateRange, formatNumber } from "@/lib/utils";

const SCHEMA: { column: string; maps: string }[] = [
  { column: "Date/Time Europe/Belgrade", maps: "date + shift (from the time window)" },
  { column: "Employees / Email", maps: "chatter (email = stable id)" },
  { column: "Creators", maps: "model (platform + tier parsed from name)" },
  { column: "Sales", maps: "sales" },
  { column: "PPV sales / Tips", maps: "ppvSales / tips" },
  { column: "Direct message sales", maps: "dmSales" },
  { column: "Direct messages sent", maps: "dmsSent" },
  { column: "Direct PPVs sent / PPVs unlocked", maps: "ppvsSent / ppvsUnlocked" },
  { column: "Priority / OF mass message sales", maps: "priorityMassSales / ofMassSales" },
  { column: "Fans chatted / Fans who spent money", maps: "fansChatted / fansWhoSpent" },
  { column: "Character count", maps: "charCount" },
];

export default function ImportPage() {
  const { dataset, chatters, models, lastUpdated, importCount, resetImports, mode } = useData();
  const dates = availableDates(dataset.rows);
  const isServer = mode === "server";

  return (
    <div>
      <PageHeader
        title="Import from infloww"
        description={
          isServer
            ? "Upload an infloww export. Data is saved to the shared database and re-imports update existing rows."
            : "Upload an infloww export. Data is saved in this browser and re-imports update existing rows."
        }
      >
        <Badge variant={isServer ? "good" : "neutral"}>
          {mode === "loading" ? "Connecting…" : isServer ? "Shared database" : "This browser only"}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Upload an export</CardTitle>
                <CardDescription>The finest-grain sheet (Detailed breakdown) is detected automatically</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Importer />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>How columns map</CardTitle>
                <CardDescription>infloww column → Trinity field</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/50 text-left text-xs text-muted">
                      <th className="px-4 py-2.5 font-medium">infloww column</th>
                      <th className="px-4 py-2.5 font-medium">Trinity field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEMA.map((r, i) => (
                      <tr key={r.column} className={i % 2 ? "bg-surface-1" : ""}>
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.column}</td>
                        <td className="px-4 py-2.5 text-secondary">{r.maps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Shifts are read from the report window: a full-day export lands under “Full day”; per-shift
                exports (04–12, 12–20, 20–04) light up the three shifts automatically.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Current dataset</CardTitle>
                <CardDescription>What the dashboard is showing</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
                <span className="grid size-10 place-items-center rounded-lg bg-surface-3 text-accent">
                  <Database className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">{formatNumber(dataset.rows.length)} rows</p>
                  <p className="text-xs text-muted">
                    {chatters.length} chatters · {models.length} models
                  </p>
                </div>
              </div>
              <Row label="Date range" value={formatDateRange(dates)} />
              <Row
                label="Last updated"
                value={lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}
              />
              {importCount > 0 && (
                <Button variant="outline" size="sm" onClick={resetImports}>
                  <RotateCcw className="size-4" />
                  Reset to sample data
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm font-medium">Where is my data stored?</p>
              {isServer ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Connected to your <span className="text-primary">shared database</span>. Imports and events
                  are saved server-side, so everyone on the team sees the same data on every device.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  No database detected, so data is saved locally in <span className="text-primary">this browser</span>{" "}
                  only. Connect a Postgres database in Vercel (env var <code className="text-primary">POSTGRES_URL</code>)
                  to share one dataset across your whole team — no code changes needed.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium tabular">{value}</span>
    </div>
  );
}
