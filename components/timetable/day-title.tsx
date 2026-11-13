"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDayTitle } from "@/lib/format";
import { useRelativeWeek } from "@/lib/hooks/use-relative-week";
import type { Week } from "@/lib/hooks/use-week";
import { useSelectedDay } from "@/lib/stores/view-store";
import { DAYS } from "@/lib/timetable/types";
import { TodayButton } from "./today-button";

type DayTitleProps = {
  week: Week;
  weekOffset: number;
  todayIndex: number | null;
  onToday: () => void;
};

export function DayTitle({
  week,
  weekOffset,
  todayIndex,
  onToday,
}: DayTitleProps) {
  const t = useTranslations("Timetable");
  const days = useTranslations("Days.long");
  const locale = useLocale();
  const relativeWeek = useRelativeWeek();
  const selected = useSelectedDay();
  const away =
    weekOffset !== 0 ||
    (todayIndex !== null && selected !== null && selected !== todayIndex);

  const relative = (index: number) => {
    if (weekOffset !== 0) return relativeWeek(weekOffset);
    if (week.today === null) return "";
    if (index === week.today) return t("today");
    return index === week.today + 1 ? t("tomorrow") : "";
  };

  return (
    <div data-view-panel="day" className="relative flex-col px-gutter pt-4">
      {DAYS.map((day, index) => (
        <div key={day} data-day-title={index} className="flex-col">
          <span className="flex min-h-7 items-center pr-32 text-overline text-foreground-muted uppercase">
            {relative(index)}
          </span>
          <h2 className="text-screen">
            {week.dates ? formatDayTitle(week.dates[index], locale) : days(day)}
          </h2>
        </div>
      ))}

      {away && (
        <TodayButton
          compact
          onToday={onToday}
          className="absolute top-4 right-gutter"
        />
      )}
    </div>
  );
}
