"use client";

import { useTranslations } from "next-intl";
import type { Week } from "@/lib/hooks/use-week";
import { setDay, useSelectedDay } from "@/lib/stores/view-store";
import { DAYS } from "@/lib/timetable/types";
import { DayChip } from "./day-chip";

export function DayStrip({ week }: { week: Week }) {
  const t = useTranslations("Timetable");
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");
  const selected = useSelectedDay();

  return (
    <div
      role="group"
      aria-label={t("days")}
      data-view-panel="day"
      className="gap-1 px-gutter pt-3 pb-2.5"
    >
      {DAYS.map((day, index) => (
        <DayChip
          key={day}
          index={index}
          label={short(day)}
          name={long(day)}
          date={week.dates ? week.dates[index].getDate() : null}
          today={week.today === index}
          selected={selected === index}
          onSelect={() => setDay(index)}
        />
      ))}
    </div>
  );
}
