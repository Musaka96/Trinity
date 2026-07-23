import Link from "next/link";
import { FlaskConical } from "lucide-react";

/**
 * Shown wherever transaction-level screens are backed by generated demo data,
 * so nobody mistakes placeholder spenders for real ones.
 */
export function DemoDataNotice() {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-[var(--warning)] bg-[var(--warning-soft)] p-3">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
      <p className="text-xs leading-relaxed text-secondary">
        <span className="font-medium text-primary">Demo data.</span> These fans and payments are generated
        placeholders so the screens are usable before a real export exists. They are never saved to the
        database.{" "}
        <Link href="/import" className="font-medium text-accent hover:underline">
          Import a transaction report
        </Link>{" "}
        to replace them.
      </p>
    </div>
  );
}
