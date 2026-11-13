"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import { minutesNow, minutesOf } from "@/lib/dates";
import type { Week } from "@/lib/hooks/use-week";
import {
  daySpan,
  weekRows,
  type Conflicts,
  type Matcher,
  type Slot,
} from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { DesktopCell } from "./desktop-cell";

type DesktopWeekProps = {
  sessions: Session[];
  group: string | null;
  mine: Matcher;
  week: Week;
  days: number[];
  conflicts: Conflicts;
  changed: ReadonlySet<string>;
  onOpen: (
    dayIndex: number,
    slot: Slot,
    anchor: SheetAnchor,
    focus: string,
  ) => void;
};

export function DesktopWeek({
  sessions,
  group,
  mine,
  week,
  days,
  conflicts,
  changed,
  onOpen,
}: DesktopWeekProps) {
  const names = useTranslations("Days.long");
  const rows = weekRows(sessions, mine);
  const spans = DAYS.map((day) => daySpan(sessions, day, mine));
  const minutes = week.now && week.today !== null ? minutesNow(week.now) : null;
  const columns = {
    gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))`,
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="flex flex-col"
        style={{ minWidth: `${Math.max(480, 56 + days.length * 150)}px` }}
      >
        <div className="grid gap-2 pb-2.5" style={columns}>
          <span />
          {days.map((index) => {
            const today = week.today === index;
            return (
              <div
                key={DAYS[index]}
                data-today-mark={index}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-3 text-sm",
                  today && "bg-primary text-primary-foreground",
                )}
              >
                <span>{names(DAYS[index])}</span>
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
              className="grid min-h-27 gap-2 border-t border-divider py-2"
              style={columns}
            >
              <span className="flex flex-col gap-0.5 pt-2 tabular-nums">
                <span className="text-note">{row.start}</span>
                <span className="text-xs text-foreground-muted">{row.end}</span>
              </span>

              {days.map((index) => {
                const cell = row.cells[index];
                const span = spans[index];
                return (
                  <DesktopCell
                    key={DAYS[index]}
                    cell={cell}
                    group={group}
                    current={running && week.today === index}
                    free={
                      cell.mains.length === 0 &&
                      span !== null &&
                      row.start >= span.start &&
                      row.end <= span.end
                    }
                    conflicts={conflicts}
                    changed={changed}
                    onOpen={(anchor, focus) =>
                      onOpen(index, row, anchor, focus)
                    }
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
