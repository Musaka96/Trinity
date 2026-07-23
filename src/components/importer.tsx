"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2, FileSpreadsheet, RotateCcw, TriangleAlert, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/store";
import { parseInflowwWorkbook } from "@/lib/import/parse-infloww";
import { StatRow } from "@/lib/types";
import { formatDateRange, formatNumber } from "@/lib/utils";

type Status = "idle" | "parsing" | "ready" | "imported" | "error";

interface Preview {
  fileName: string;
  rows: StatRow[];
  sheetUsed: string;
  warnings: string[];
  dates: string[];
  chatters: number;
  models: number;
}

export function Importer() {
  const { importRows } = useData();
  const [status, setStatus] = React.useState<Status>("idle");
  const [dragging, setDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [result, setResult] = React.useState<{ added: number; updated: number; dates: string[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("parsing");
    setError(null);
    setResult(null);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const res = parseInflowwWorkbook(buf);
      if (res.rows.length === 0) {
        setError(res.warnings[0] ?? "No usable rows were found in this file.");
        setStatus("error");
        return;
      }
      setPreview({
        fileName: file.name,
        rows: res.rows,
        sheetUsed: res.sheetUsed,
        warnings: res.warnings,
        dates: Array.from(new Set(res.rows.map((r) => r.date))).sort(),
        chatters: new Set(res.rows.map((r) => r.chatterId)).size,
        models: new Set(res.rows.map((r) => r.creator)).size,
      });
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read the file.");
      setStatus("error");
    }
  }

  const [applying, setApplying] = React.useState(false);
  async function applyImport() {
    if (!preview) return;
    setApplying(true);
    try {
      const diff = await importRows(preview.rows);
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
          <p className="mt-0.5 text-sm text-muted">.xlsx or .csv — the “Detailed breakdown” sheet is used automatically</p>
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
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-accent" />
            <p className="text-sm font-medium">{preview.fileName}</p>
            <Badge variant="neutral">{preview.sheetUsed}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Rows" value={formatNumber(preview.rows.length)} />
            <Stat label="Date range" value={formatDateRange(preview.dates)} />
            <Stat label="Chatters" value={String(preview.chatters)} />
            <Stat label="Models" value={String(preview.models)} />
          </div>
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
            <p className="text-sm font-medium text-primary">Import applied — saved to this browser</p>
            <p className="mt-0.5 text-sm text-secondary">
              {result.added} new rows added, {result.updated} existing rows updated across{" "}
              {formatDateRange(result.dates)}. Re-importing a corrected export overwrites the same rows.
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
