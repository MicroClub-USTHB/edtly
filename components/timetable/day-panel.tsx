"use client";

import { useTranslations } from "next-intl";
import { useDragState } from "@/components/overrides/timetable-dnd";
import type { SheetAnchor } from "@/components/ui/sheet";
import {
  daySlots,
  freeGaps,
  freeSlots,
  nextSessionAfter,
  slotStatuses,
  type Conflicts,
  type DayStatus,
  type Matcher,
  type Slot,
} from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { DayEmpty } from "./day-empty";
import { FreeSlotsRow } from "./free-slots-row";
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
  editable: Matcher;
  active: boolean;
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
  editable,
  active,
  onOpen,
  onClearFilters,
}: DayPanelProps) {
  const days = useTranslations("Days.long");
  const t = useTranslations("Overrides");
  const dragging = useDragState().source?.surface === "day";
  const day = DAYS[index];
  const dayName = days(day);
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
  const zonesOf = (gap: Slot) => (dragging ? freeSlots(slots, gap) : []);
  const inGaps = gaps.flatMap(zonesOf);
  const later = dragging
    ? freeSlots(slots).filter(
        (slot) => !inGaps.some((zone) => zone.start === slot.start),
      )
    : [];
  const items = [
    ...slots.map((slot) => ({ start: slot.start, slot, gap: null })),
    ...gaps.map((gap) => ({ start: gap.start, slot: null, gap })),
  ].sort((a, b) => a.start.localeCompare(b.start));
  const laterRow = later.length > 0 && (
    <FreeSlotsRow
      day={day}
      dayName={dayName}
      slots={later}
      active={active}
      label={t("otherTimes")}
    />
  );

  return (
    <section data-day-panel={index} className="flex flex-col gap-4">
      <h3 className="sr-only">{dayName}</h3>

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
        <>
          <DayEmpty
            day={day}
            group={group}
            isToday={minutes !== null}
            filtered={filtered}
            next={nextSessionAfter(sessions, mine, index)}
            onClearFilters={onClearFilters}
          />
          {laterRow && <ul className="flex flex-col gap-2.5">{laterRow}</ul>}
        </>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => {
            if (item.slot) {
              return (
                <SlotRow
                  key={`${item.slot.start}-${item.slot.end}`}
                  day={day}
                  dayName={dayName}
                  slot={item.slot}
                  group={group}
                  status={statuses?.get(item.slot.start)}
                  conflicts={conflicts}
                  changed={changed}
                  editable={editable}
                  active={active}
                  onOpen={(anchor, focus) =>
                    onOpen(index, item.slot, anchor, focus ?? null)
                  }
                />
              );
            }
            const zones = zonesOf(item.gap);
            return (
              <GapRow
                key={`gap-${item.gap.start}`}
                gap={item.gap}
                day={day}
                dayName={dayName}
                zones={zones.length > 0 ? zones : null}
                active={active}
              />
            );
          })}
          {laterRow}
        </ul>
      )}
    </section>
  );
}
