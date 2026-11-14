"use client";

import type { Slot } from "@/lib/timetable/schedule";
import type { Day } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { DropZone } from "./drop-zone";

type DropSegmentsProps = {
  day: Day;
  dayName: string;
  slots: Slot[];
  active: boolean;
  className?: string;
};

export function DropSegments({
  day,
  dayName,
  slots,
  active,
  className,
}: DropSegmentsProps) {
  return (
    <div className={cn("flex min-h-9 gap-1.5", className)}>
      {slots.map((slot) => (
        <DropZone
          key={slot.start}
          id={`day:${day}:${slot.start}-${slot.end}`}
          target={{ kind: "slot", day, slot, label: `${dayName} ${slot.start}` }}
          disabled={!active}
          shape="pill"
          className="flex min-w-0 flex-1"
        >
          <span className="flex min-h-9 flex-1 items-center justify-center text-note text-foreground-muted tabular-nums">
            {slot.start}
          </span>
        </DropZone>
      ))}
    </div>
  );
}
