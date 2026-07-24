"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RATING_MAX } from "@/lib/ratings";

const STAR_PATH =
  "M12 2.4l2.85 6.03 6.55.79-4.84 4.53 1.29 6.5L12 17.1l-5.85 3.15 1.29-6.5L2.6 9.22l6.55-.79z";

function Star({ fill, size, color }: { fill: number; size: number; color: string }) {
  const pct = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size} className="absolute inset-0">
        <path d={STAR_PATH} fill="var(--surface-3)" stroke="var(--border-strong)" strokeWidth="1" />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <svg viewBox="0 0 24 24" width={size} height={size} className="block">
          <path d={STAR_PATH} fill={color} />
        </svg>
      </span>
    </span>
  );
}

export function StarRating({
  value,
  onChange,
  max = RATING_MAX,
  size = 18,
  color = "var(--warning)",
  showValue = true,
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  max?: number;
  size?: number;
  color?: string;
  showValue?: boolean;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const readOnly = !onChange;
  const shown = hover ?? value;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="inline-flex items-center gap-0.5"
        onMouseLeave={() => setHover(null)}
        role={readOnly ? "img" : undefined}
        aria-label={readOnly ? `${value.toFixed(1)} out of ${max}` : undefined}
      >
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.max(0, Math.min(1, shown - i));
          if (readOnly) return <Star key={i} fill={fill} size={size} color={color} />;
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star fill={fill} size={size} color={color} />
              {/* Left half = x.5, right half = x.0 */}
              <button
                type="button"
                aria-label={`Set ${i + 0.5} of ${max}`}
                onMouseEnter={() => setHover(i + 0.5)}
                onClick={() => onChange(i + 0.5)}
                className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
              />
              <button
                type="button"
                aria-label={`Set ${i + 1} of ${max}`}
                onMouseEnter={() => setHover(i + 1)}
                onClick={() => onChange(i + 1)}
                className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
              />
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="w-8 text-right text-xs font-medium tabular text-secondary">
          {shown > 0 ? shown.toFixed(1) : "—"}
        </span>
      )}
      {!readOnly && value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-[11px] text-muted transition-colors hover:text-critical"
        >
          clear
        </button>
      )}
    </span>
  );
}

/** Compact read-only display: one star + the numeric score. */
export function ScorePill({ score, color }: { score: number | null; color?: string }) {
  if (score === null) return <span className="text-xs text-muted">Not rated</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Star fill={1} size={14} color={color ?? "var(--warning)"} />
      <span className="text-sm font-medium tabular text-primary">{score.toFixed(1)}</span>
      <span className="text-xs text-muted">/{RATING_MAX}</span>
    </span>
  );
}
