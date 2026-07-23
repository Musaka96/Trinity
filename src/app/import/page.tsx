import type { Metadata } from "next";
import { Plug, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImportDropzone } from "@/components/import-dropzone";

export const metadata: Metadata = { title: "Import" };

const SCHEMA: { column: string; maps: string; example: string }[] = [
  { column: "date", maps: "SalesRecord.date", example: "2026-07-22" },
  { column: "shift", maps: "SalesRecord.shift", example: "night" },
  { column: "chatter", maps: "Chatter.name → id", example: "Alex Carter" },
  { column: "model", maps: "Model.name → id", example: "Aurora Vale" },
  { column: "gross", maps: "SalesRecord.gross", example: "742.00" },
  { column: "net", maps: "SalesRecord.net", example: "563.00" },
  { column: "ppv_sent", maps: "SalesRecord.ppvSent", example: "24" },
  { column: "ppv_unlocked", maps: "SalesRecord.ppvUnlocked", example: "11" },
  { column: "tips", maps: "SalesRecord.tips", example: "88.00" },
  { column: "messages", maps: "SalesRecord.messagesSent", example: "412" },
];

export default function ImportPage() {
  return (
    <div>
      <PageHeader
        title="Import from inflow"
        description="Connect your inflow account or upload an export to sync sales data."
      >
        <Badge variant="warning">
          <Clock className="size-3" /> Not connected
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Upload an export</CardTitle>
                <CardDescription>Drop a CSV/XLSX exported from inflow to preview the mapping</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ImportDropzone />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Expected columns</CardTitle>
                <CardDescription>How inflow columns map onto Trinity&apos;s data model</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/50 text-left text-xs text-muted">
                      <th className="px-4 py-2.5 font-medium">inflow column</th>
                      <th className="px-4 py-2.5 font-medium">Trinity field</th>
                      <th className="px-4 py-2.5 font-medium">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEMA.map((r, i) => (
                      <tr key={r.column} className={i % 2 ? "bg-surface-1" : ""}>
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.column}</td>
                        <td className="px-4 py-2.5 text-secondary">{r.maps}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted">{r.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Live sync</CardTitle>
                <CardDescription>Auto-import on a schedule</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-3">
                <span className="grid size-10 place-items-center rounded-lg bg-surface-3 text-accent">
                  <Plug className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">inflow API</p>
                  <p className="text-xs text-muted">Connect once, sync every shift</p>
                </div>
              </div>
              <Button disabled className="w-full">
                Connect inflow (coming soon)
              </Button>
              <p className="text-xs leading-relaxed text-muted">
                Once connected, Trinity pulls new sales rows automatically after each shift closes and
                keeps the dashboard live. The demo currently runs on generated sample data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm font-medium">Import steps</p>
              <ol className="mt-3 flex flex-col gap-3">
                {["Upload or connect", "Confirm column mapping", "Validate & preview", "Sync to dashboard"].map(
                  (step, i) => (
                    <li key={step} className="flex items-center gap-3 text-sm text-secondary">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs font-medium text-muted">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ),
                )}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
