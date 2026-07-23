import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DateSwitcher } from "@/components/date-switcher";
import { ShiftBoard } from "@/components/shift-board";
import { availableDates, shiftBoard } from "@/lib/analytics";

export const metadata: Metadata = { title: "Shifts" };

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const dates = availableDates();
  const current = date && dates.includes(date) ? date : dates[dates.length - 1];
  const columns = shiftBoard(current);

  return (
    <div>
      <PageHeader
        title="Shifts"
        description="Three shifts a day — who worked, and which models they covered."
      >
        <Suspense>
          <DateSwitcher dates={dates} current={current} />
        </Suspense>
      </PageHeader>

      <ShiftBoard columns={columns} />
    </div>
  );
}
