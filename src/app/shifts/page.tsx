"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ShiftBoard } from "@/components/shift-board";
import { useData } from "@/lib/store";
import { availableDates, board } from "@/lib/analytics";
import { formatDate } from "@/lib/utils";

export default function ShiftsPage() {
  const { dataset, chatters, models, events } = useData();
  const dates = availableDates(dataset.rows);
  const [idx, setIdx] = React.useState(0);

  // Default to the most recent day once data is available.
  React.useEffect(() => {
    if (dates.length) setIdx(dates.length - 1);
  }, [dates.length]);

  const current = dates[Math.min(idx, dates.length - 1)] ?? dates[0];
  const columns = current ? board(dataset.rows, current, chatters, models) : [];

  return (
    <div>
      <PageHeader
        title="Shifts"
        description="04–12 · 12–20 · 20–04. Who worked, which models they covered, and any events on the day."
      >
        {current && (
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="icon" disabled={idx <= 0} onClick={() => setIdx((i) => i - 1)} aria-label="Previous day">
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-[180px] rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-center text-sm font-medium">
              {formatDate(current)}
            </div>
            <Button
              variant="secondary"
              size="icon"
              disabled={idx >= dates.length - 1}
              onClick={() => setIdx((i) => i + 1)}
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </PageHeader>

      {current ? (
        <ShiftBoard columns={columns} date={current} events={events} />
      ) : (
        <p className="py-20 text-center text-muted">No data loaded yet. Import an infloww export to get started.</p>
      )}
    </div>
  );
}
