import * as React from "react";
import { SpendTier } from "@/lib/tiers";

/** Colour-coded tag for a fan's spend tier. */
export function TierBadge({ tier, size = "sm" }: { tier: SpendTier | null; size?: "sm" | "md" }) {
  if (!tier) return null;
  return (
    <span
      className={
        size === "md"
          ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          : "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      }
      style={{ background: `${tier.color}22`, color: tier.color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: tier.color }} />
      {tier.label}
    </span>
  );
}
