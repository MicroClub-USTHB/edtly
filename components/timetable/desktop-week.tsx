"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import { minutesNow, minutesOf } from "@/lib/dates";
import type { Week } from "@/lib/hooks/use-week";
import { weekRows, type Slot } from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { DesktopCell } from "./desktop-cell";

type DesktopWeekProps = {
  sessions: Session[];
  group: string | null;
  week: Week;
  changed: ReadonlySet<string>;
  onOpen: (
    dayIndex: number,
    slot: Slot,
    anchor: SheetAnchor,
    focus: string,
  ) => void;
};

const COLUMNS = "grid grid-cols-[56px_repeat(6,minmax(0,1fr))] gap-2";

export function DesktopWeek({
  sessions,
  group,
  week,
  changed,
  onOpen,
}: DesktopWeekProps) {
  const days = useTranslations("Days.long");
  const rows = weekRows(sessions, group);
  const minutes = week.now && week.today !== null ? minutesNow(week.now) : null;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-240 flex-col">
        <div className={cn(COLUMNS, "pb-2.5")}>
          <span />
          {DAYS.map((day, index) => {
            const today = week.today === index;
            return (
              <div
                key={day}
                data-today-mark={index}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-3 text-sm",
                  today && "bg-primary text-primary-foreground",
                )}
              >
                <span>{days(day)}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    !today && "text-foreground-muted",
                  )}
                >
                  {week.dates?.[index].getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {rows.map((row) => {
          const running =
            minutes !== null &&
            minutesOf(row.start) <= minutes &&
            minutes < minutesOf(row.end);
          return (
            <div
              key={row.start}
              className={cn(COLUMNS, "min-h-27 border-t border-divider py-2")}
            >
              <span className="flex flex-col gap-0.5 pt-2 tabular-nums">
                <span className="text-note">{row.start}</span>
                <span className="text-xs text-foreground-muted">{row.end}</span>
              </span>

              {row.cells.map((cell, index) => (
                <DesktopCell
                  key={DAYS[index]}
                  cell={cell}
                  group={group}
                  current={running && week.today === index}
                  changed={changed}
                  onOpen={(anchor, focus) => onOpen(index, row, anchor, focus)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
