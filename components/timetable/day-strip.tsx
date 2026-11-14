"use client";

import { useTranslations } from "next-intl";
import { DropZone } from "@/components/overrides/drop-zone";
import type { Week } from "@/lib/hooks/use-week";
import { setDay, useSelectedDay, useView } from "@/lib/stores/view-store";
import { DAYS } from "@/lib/timetable/types";
import { DayChip } from "./day-chip";

type DayStripProps = {
  week: Week;
  days: number[];
};

export function DayStrip({ week, days }: DayStripProps) {
  const t = useTranslations("Timetable");
  const overrides = useTranslations("Overrides");
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");
  const selected = useSelectedDay();
  const view = useView();

  return (
    <div
      role="group"
      aria-label={t("days")}
      data-view-panel="day"
      className="px-gutter pt-3 pb-2.5"
    >
      <div className="grid w-full grid-cols-6 gap-1">
        {days.map((index) => {
          const day = DAYS[index];
          return (
            <DropZone
              key={day}
              id={`chip:${day}`}
              target={{
                kind: "day",
                day,
                label: overrides("sameTime", { day: long(day) }),
              }}
              disabled={view !== "day"}
              shape="chip"
              className="flex min-w-0"
            >
              <DayChip
                index={index}
                label={short(day)}
                name={long(day)}
                date={week.dates ? week.dates[index].getDate() : null}
                today={week.today === index}
                selected={selected === index}
                onSelect={() => setDay(index)}
              />
            </DropZone>
          );
        })}
      </div>
    </div>
  );
}
