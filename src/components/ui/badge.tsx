import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-3 text-secondary",
        accent: "bg-[var(--accent-soft)] text-accent",
        good: "bg-[var(--good-soft)] text-good",
        warning: "bg-[var(--warning-soft)] text-warning",
        critical: "bg-[var(--critical-soft)] text-critical",
        outline: "border border-border text-secondary",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />;
}

export function StatusDot({ status }: { status: "active" | "paused" | "inactive" }) {
  const color =
    status === "active" ? "var(--good)" : status === "paused" ? "var(--warning)" : "var(--text-muted)";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs capitalize text-secondary">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}
