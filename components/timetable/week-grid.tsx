"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import type { Week } from "@/lib/hooks/use-week";
import { weekRows, type Matcher, type Slot } from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { WeekCell } from "./week-cell";

type WeekGridProps = {
  sessions: Session[];
  mine: Matcher;
  week: Week;
  onOpen: (dayIndex: number, slot: Slot, anchor: SheetAnchor) => void;
};

const COLUMNS = "grid grid-cols-[34px_repeat(6,minmax(0,1fr))] gap-1";

export function WeekGrid({ sessions, mine, week, onOpen }: WeekGridProps) {
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");
  const rows = weekRows(sessions, mine);

  return (
    <div data-view-panel="week" className="flex-col gap-1 px-4 pt-3.5 pb-4">
      <div className={COLUMNS}>
        <span />
        {DAYS.map((day, index) => {
          const today = week.today === index;
          return (
            <div
              key={day}
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
                {short(day)}
              </span>
              <span className="text-[13px] leading-4.5 tabular-nums">
                {week.dates ? week.dates[index].getDate() : " "}
              </span>
            </div>
          );
        })}
      </div>

      {rows.map((row) => (
        <div key={row.start} className={cn(COLUMNS, "h-18")}>
          <span className="pt-2 text-tab text-foreground-muted tabular-nums">
            {row.start}
          </span>
          {row.cells.map((cell, index) => (
            <WeekCell
              key={DAYS[index]}
              cell={cell}
              dayName={long(DAYS[index])}
              onOpen={(anchor) => onOpen(index, row, anchor)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
