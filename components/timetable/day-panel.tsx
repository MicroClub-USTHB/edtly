"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import {
  daySlots,
  nextSessionAfter,
  slotStatuses,
  type Slot,
} from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { DayEmpty } from "./day-empty";
import { SlotRow } from "./slot-row";

type DayPanelProps = {
  index: number;
  sessions: Session[];
  group: string | null;
  minutes: number | null;
  changed: ReadonlySet<string>;
  onOpen: (dayIndex: number, slot: Slot, anchor: SheetAnchor) => void;
};

export function DayPanel({
  index,
  sessions,
  group,
  minutes,
  changed,
  onOpen,
}: DayPanelProps) {
  const days = useTranslations("Days.long");
  const day = DAYS[index];
  const slots = daySlots(sessions, day, group);
  const statuses = minutes === null ? null : slotStatuses(slots, minutes);

  return (
    <section data-day-panel={index} className="flex flex-col">
      <h3 className="sr-only">{days(day)}</h3>

      {slots.length === 0 ? (
        <DayEmpty
          day={day}
          group={group}
          isToday={minutes !== null}
          next={nextSessionAfter(sessions, group, index)}
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {slots.map((slot) => (
            <SlotRow
              key={slot.start}
              slot={slot}
              group={group}
              status={statuses?.get(slot.start)}
              changed={changed}
              onOpen={(anchor) => onOpen(index, slot, anchor)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
