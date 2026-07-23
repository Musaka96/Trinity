"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2, FileSpreadsheet, RotateCcw, TriangleAlert, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/store";
import { parseReport } from "@/lib/import/parse-report";
import { StatRow, Transaction } from "@/lib/types";
import { formatDateRange, formatNumber } from "@/lib/utils";

type Status = "idle" | "parsing" | "ready" | "imported" | "error";

interface Preview {
  fileName: string;
  kind: "stats" | "transactions";
  rows?: StatRow[];
  transactions?: Transaction[];
  sheetUsed: string;
  warnings: string[];
  dates: string[];
  count: number;
  chatters: number;
  models: number;
  fans?: number;
}

export function Importer() {
  const { importRows, importTransactions, mode } = useData();
  const dest = mode === "server" ? "the shared database" : "this browser";
  const [status, setStatus] = React.useState<Status>("idle");
  const [dragging, setDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [result, setResult] = React.useState<{ added: number; updated: number; dates: string[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [applying, setApplying] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("parsing");
    setError(null);
    setResult(null);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const parsed = parseReport(buf);

      if (parsed.kind === "unknown") {
        setError(parsed.warnings[0]);
        setStatus("error");
        return;
      }

      if (parsed.kind === "transactions") {
        const t = parsed.transactions;
        setPreview({
          fileName: file.name,
          kind: "transactions",
          transactions: t,
          sheetUsed: parsed.sheetUsed,
          warnings: parsed.warnings,
          dates: Array.from(new Set(t.map((x) => x.date))).sort(),
          count: t.length,
          chatters: new Set(t.map((x) => x.chatterId)).size,
          models: new Set(t.map((x) => x.creator)).size,
          fans: new Set(t.map((x) => x.fanId)).size,
        });
      } else {
        const r = parsed.rows;
        setPreview({
          fileName: file.name,
          kind: "stats",
          rows: r,
          sheetUsed: parsed.sheetUsed,
          warnings: parsed.warnings,
          dates: Array.from(new Set(r.map((x) => x.date))).sort(),
          count: r.length,
          chatters: new Set(r.map((x) => x.chatterId)).size,
          models: new Set(r.map((x) => x.creator)).size,
        });
      }
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read the file.");
      setStatus("error");
    }
  }

  async function applyImport() {
    if (!preview) return;
    setApplying(true);
    try {
      const diff =
        preview.kind === "transactions"
          ? await importTransactions(preview.transactions!)
          : await importRows(preview.rows!);
      setResult(diff);
      setStatus("imported");
    } finally {
      setApplying(false);
    }
  }

  function reset() {
    setStatus("idle");
    setPreview(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        animate={{
          borderColor: dragging ? "var(--accent)" : "var(--border)",
          backgroundColor: dragging ? "var(--accent-soft)" : "transparent",
        }}
        className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed p-10 text-center"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-surface-2 text-accent">
          <UploadCloud className="size-6" />
        </span>
        <div>
          <p className="font-medium">Drop your infloww export here</p>
          <p className="mt-0.5 text-sm text-muted">
            Daily breakdown or transaction report — the type is detected automatically
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          <FileSpreadsheet className="size-4" />
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </motion.div>

      {status === "parsing" && <p className="text-sm text-muted">Parsing…</p>}

      {status === "error" && error && (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--critical)] bg-[var(--critical-soft)] p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-critical" />
          <div>
            <p className="text-sm font-medium text-primary">Could not import</p>
            <p className="mt-0.5 text-sm text-secondary">{error}</p>
          </div>
        </div>
      )}

      {status === "ready" && preview && (
        <div className="rounded-lg border border-border bg-surface-2/50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <FileSpreadsheet className="size-4 text-accent" />
            <p className="text-sm font-medium">{preview.fileName}</p>
            <Badge variant="accent">
              {preview.kind === "transactions" ? "Transactions" : "Daily breakdown"}
            </Badge>
            <Badge variant="neutral">{preview.sheetUsed}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label={preview.kind === "transactions" ? "Sales" : "Rows"} value={formatNumber(preview.count)} />
            <Stat label="Date range" value={formatDateRange(preview.dates)} />
            <Stat label="Chatters" value={String(preview.chatters)} />
            <Stat label="Models" value={String(preview.models)} />
            {preview.fans !== undefined && <Stat label="Fans" value={String(preview.fans)} />}
          </div>
          {preview.warnings.length > 0 && (
            <p className="mt-3 text-xs text-warning">{preview.warnings.join(" ")}</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={applyImport} disabled={applying}>
              {applying ? "Applying…" : "Apply import"}
            </Button>
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {status === "imported" && result && (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--good)] bg-[var(--good-soft)] p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-good" />
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">Import applied — saved to {dest}</p>
            <p className="mt-0.5 text-sm text-secondary">
              {result.added} new added, {result.updated} existing updated across{" "}
              {formatDateRange(result.dates)}. Re-importing a corrected export overwrites the same records.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={reset}>
              <RotateCcw className="size-4" />
              Import another file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular">{value}</p>
    </div>
  );
}
