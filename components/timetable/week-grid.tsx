"use client";

import { useTranslations } from "next-intl";
import { DropZone } from "@/components/overrides/drop-zone";
import { useDragState } from "@/components/overrides/timetable-dnd";
import type { SheetAnchor } from "@/components/ui/sheet";
import type { Week } from "@/lib/hooks/use-week";
import { useView } from "@/lib/stores/view-store";
import {
  daySpan,
  gridSlots,
  sessionKey,
  weekRows,
  type Conflicts,
  type Matcher,
  type Slot,
} from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { WeekCell } from "./week-cell";

type WeekGridProps = {
  sessions: Session[];
  mine: Matcher;
  week: Week;
  days: number[];
  conflicts: Conflicts;
  editable: Matcher;
  onOpen: (dayIndex: number, slot: Slot, anchor: SheetAnchor) => void;
};

export function WeekGrid({
  sessions,
  mine,
  week,
  days,
  conflicts,
  editable,
  onOpen,
}: WeekGridProps) {
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");
  const view = useView();
  const drag = useDragState();
  const dragging = drag.source?.surface === "week";
  const rows = weekRows(sessions, mine, gridSlots(sessions, dragging));
  const spans = DAYS.map((day) => daySpan(sessions, day, mine));
  const columns = {
    gridTemplateColumns: `34px repeat(${days.length}, minmax(0, 1fr))`,
  };

  return (
    <div data-view-panel="week" className="flex-col gap-1 px-4 pt-3.5 pb-4 sm:px-gutter">
      <div className="grid gap-1" style={columns}>
        <span />
        {days.map((index) => {
          const today = week.today === index;
          return (
            <div
              key={DAYS[index]}
              data-today-mark={index}
              className={cn(
                "flex h-10 flex-col items-center justify-center rounded-cell",
                today
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground-secondary",
              )}
            >
              <span
                className={cn(
                  "text-tab tracking-[0.08em] uppercase",
                  !today && "text-foreground-muted",
                )}
              >
                {short(DAYS[index])}
              </span>
              <span className="text-[13px] leading-4.5 tabular-nums">
                {week.dates ? week.dates[index].getDate() : " "}
              </span>
            </div>
          );
        })}
      </div>

      {rows.map((row) => (
        <div
          key={`${row.start}-${row.end}`}
          className="grid h-18 gap-1"
          style={columns}
        >
          <span className="pt-2 text-tab text-foreground-muted tabular-nums">
            {row.start}
          </span>
          {days.map((index) => {
            const cell = row.cells[index];
            const span = spans[index];
            const day = DAYS[index];
            return (
              <DropZone
                key={day}
                id={`week:${day}:${row.start}-${row.end}`}
                target={{
                  kind: "slot",
                  day,
                  slot: { start: row.start, end: row.end },
                  label: `${long(day)} ${row.start}`,
                }}
                disabled={view !== "week"}
                shape="week"
                className="flex min-w-0"
              >
                <WeekCell
                  cell={cell}
                  day={day}
                  dayName={long(day)}
                  conflict={cell.mains.some((session) =>
                    conflicts.has(sessionKey(session)),
                  )}
                  free={
                    cell.mains.length === 0 &&
                    span !== null &&
                    row.start >= span.start &&
                    row.end <= span.end
                  }
                  editable={editable}
                  onOpen={(anchor) => onOpen(index, row, anchor)}
                />
              </DropZone>
            );
          })}
        </div>
      ))}
    </div>
  );
}
