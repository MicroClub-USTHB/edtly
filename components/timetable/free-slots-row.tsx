"use client";

import { Plus } from "lucide-react";
import { DropSegments } from "@/components/overrides/drop-segments";
import type { Slot } from "@/lib/timetable/schedule";
import type { Day } from "@/lib/timetable/types";

type FreeSlotsRowProps = {
  day: Day;
  dayName: string;
  slots: Slot[];
  active: boolean;
  label: string;
};

export function FreeSlotsRow({
  day,
  dayName,
  slots,
  active,
  label,
}: FreeSlotsRowProps) {
  return (
    <li aria-label={label} className="flex gap-3">
      <span className="flex w-10.5 shrink-0 justify-center pt-2.5 text-foreground-muted">
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <DropSegments
        day={day}
        dayName={dayName}
        slots={slots}
        active={active}
        className="grid flex-1 grid-cols-3"
      />
    </li>
  );
}
