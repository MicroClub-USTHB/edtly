"use client";

import { useTranslations } from "next-intl";
import type { Week } from "@/lib/hooks/use-week";
import { setDay, useSelectedDay } from "@/lib/stores/view-store";
import { DAYS } from "@/lib/timetable/types";
import { DayChip } from "./day-chip";

type DayStripProps = {
  week: Week;
  days: number[];
};

export function DayStrip({ week, days }: DayStripProps) {
  const t = useTranslations("Timetable");
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");
  const selected = useSelectedDay();

  return (
    <div
      role="group"
      aria-label={t("days")}
      data-view-panel="day"
      className="px-gutter pt-3 pb-2.5"
    >
      <div className="grid w-full grid-cols-6 gap-1">
        {days.map((index) => (
          <DayChip
            key={DAYS[index]}
            index={index}
            label={short(DAYS[index])}
            name={long(DAYS[index])}
            date={week.dates ? week.dates[index].getDate() : null}
            today={week.today === index}
            selected={selected === index}
            onSelect={() => setDay(index)}
          />
        ))}
      </div>
    </div>
  );
}
