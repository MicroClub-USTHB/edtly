"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import type { Week } from "@/lib/hooks/use-week";
import {
  daySpan,
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
  onOpen: (dayIndex: number, slot: Slot, anchor: SheetAnchor) => void;
};

export function WeekGrid({
  sessions,
  mine,
  week,
  days,
  conflicts,
  onOpen,
}: WeekGridProps) {
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");
  const rows = weekRows(sessions, mine);
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
                {week.dates ? week.dates[index].getDate() : " "}
              </span>
            </div>
          );
        })}
      </div>

      {rows.map((row) => (
        <div key={row.start} className="grid h-18 gap-1" style={columns}>
          <span className="pt-2 text-tab text-foreground-muted tabular-nums">
            {row.start}
          </span>
          {days.map((index) => {
            const cell = row.cells[index];
            const span = spans[index];
            return (
              <WeekCell
                key={DAYS[index]}
                cell={cell}
                dayName={long(DAYS[index])}
                conflict={cell.mains.some((session) =>
                  conflicts.has(sessionKey(session)),
                )}
                free={
                  cell.mains.length === 0 &&
                  span !== null &&
                  row.start >= span.start &&
                  row.end <= span.end
                }
                onOpen={(anchor) => onOpen(index, row, anchor)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
