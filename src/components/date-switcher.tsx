"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DateSwitcher({ dates, current }: { dates: string[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const idx = dates.indexOf(current);

  const go = (target: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("date", target);
    router.push(`/shifts?${next.toString()}`);
  };

  const label = new Date(current + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="secondary"
        size="icon"
        disabled={idx <= 0}
        onClick={() => go(dates[idx - 1])}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-[190px] rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-center text-sm font-medium">
        {label}
      </div>
      <Button
        variant="secondary"
        size="icon"
        disabled={idx >= dates.length - 1}
        onClick={() => go(dates[idx + 1])}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
