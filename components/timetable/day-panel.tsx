"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import {
  daySlots,
  freeGaps,
  nextSessionAfter,
  slotStatuses,
  type Conflicts,
  type DayStatus,
  type Matcher,
  type Slot,
} from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { DayEmpty } from "./day-empty";
import { GapRow } from "./gap-row";
import { NowNext } from "./now-next";
import { SlotRow } from "./slot-row";

export type OpenSlot = (
  dayIndex: number,
  slot: Slot,
  anchor: SheetAnchor,
  focus?: string | null,
) => void;

type DayPanelProps = {
  index: number;
  sessions: Session[];
  group: string | null;
  mine: Matcher;
  minutes: number | null;
  status: DayStatus | null;
  conflicts: Conflicts;
  showGaps: boolean;
  filtered: boolean;
  changed: ReadonlySet<string>;
  onOpen: OpenSlot;
  onClearFilters: () => void;
};

export function DayPanel({
  index,
  sessions,
  group,
  mine,
  minutes,
  status,
  conflicts,
  showGaps,
  filtered,
  changed,
  onOpen,
  onClearFilters,
}: DayPanelProps) {
  const days = useTranslations("Days.long");
  const day = DAYS[index];
  const slots = daySlots(sessions, day, mine);
  const statuses = minutes === null ? null : slotStatuses(slots, minutes);
  const gaps = showGaps
    ? freeGaps(sessions, day, mine).filter(
        (gap) =>
          !slots.some(
            (slot) => slot.start >= gap.start && slot.start < gap.end,
          ),
      )
    : [];
  const items = [
    ...slots.map((slot) => ({ start: slot.start, slot, gap: null })),
    ...gaps.map((gap) => ({ start: gap.start, slot: null, gap })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <section data-day-panel={index} className="flex flex-col gap-4">
      <h3 className="sr-only">{days(day)}</h3>

      {status && (
        <NowNext
          status={status}
          todayIndex={index}
          group={group}
          onOpen={(dayIndex, session, anchor, focus) =>
            onOpen(dayIndex, session, anchor, focus)
          }
        />
      )}

      {slots.length === 0 ? (
        <DayEmpty
          day={day}
          group={group}
          isToday={minutes !== null}
          filtered={filtered}
          next={nextSessionAfter(sessions, mine, index)}
          onClearFilters={onClearFilters}
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) =>
            item.slot ? (
              <SlotRow
                key={item.slot.start}
                slot={item.slot}
                group={group}
                status={statuses?.get(item.slot.start)}
                conflicts={conflicts}
                changed={changed}
                onOpen={(anchor) => onOpen(index, item.slot, anchor)}
              />
            ) : (
              <GapRow key={`gap-${item.gap.start}`} gap={item.gap} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}
