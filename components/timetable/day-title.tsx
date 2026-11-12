"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDayTitle } from "@/lib/format";
import type { Week } from "@/lib/hooks/use-week";
import { DAYS } from "@/lib/timetable/types";

export function DayTitle({ week }: { week: Week }) {
  const t = useTranslations("Timetable");
  const days = useTranslations("Days.long");
  const locale = useLocale();

  const relative = (index: number) => {
    if (week.today === null) return "";
    if (index === week.today) return t("today");
    return index === week.today + 1 ? t("tomorrow") : "";
  };

  return (
    <div data-view-panel="day" className="flex-col px-gutter pt-5">
      {DAYS.map((day, index) => (
        <div key={day} data-day-title={index} className="flex-col gap-0.5">
          <span className="min-h-4 text-overline text-foreground-muted uppercase">
            {relative(index)}
          </span>
          <h2 className="text-screen">
            {week.dates
              ? formatDayTitle(week.dates[index], locale)
              : days(day)}
          </h2>
        </div>
      ))}
    </div>
  );
}
