"use client";

import * as React from "react";
import { motion } from "motion/react";
import { FileSpreadsheet, UploadCloud, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImportDropzone() {
  const [dragging, setDragging] = React.useState(false);
  const [file, setFile] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div>
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
          if (f) setFile(f.name);
        }}
        animate={{
          borderColor: dragging ? "var(--accent)" : "var(--border)",
          backgroundColor: dragging ? "var(--accent-soft)" : "transparent",
        }}
        className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed p-10 text-center"
      >
        {file ? (
          <>
            <span className="grid size-12 place-items-center rounded-xl bg-[var(--good-soft)] text-good">
              <CheckCircle2 className="size-6" />
            </span>
            <div>
              <p className="font-medium">{file}</p>
              <p className="mt-0.5 text-sm text-muted">Ready to map columns — parsing is added when data is connected.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setFile(null)}>
              Choose a different file
            </Button>
          </>
        ) : (
          <>
            <span className="grid size-12 place-items-center rounded-xl bg-surface-2 text-accent">
              <UploadCloud className="size-6" />
            </span>
            <div>
              <p className="font-medium">Drop your inflow export here</p>
              <p className="mt-0.5 text-sm text-muted">CSV or XLSX, up to 25 MB</p>
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
              onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
