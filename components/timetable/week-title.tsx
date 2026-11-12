"use client";

import { useLocale, useTranslations } from "next-intl";
import { todayIndex } from "@/lib/dates";
import { formatWeekRange } from "@/lib/format";
import type { Week } from "@/lib/hooks/use-week";

export function WeekTitle({ week }: { week: Week }) {
  const t = useTranslations("Timetable");
  const locale = useLocale();
  const upcoming = week.now !== null && todayIndex(week.now) === null;

  return (
    <div data-view-panel="week" className="flex-col gap-0.5 px-gutter pt-5">
      <span className="min-h-4 text-overline text-foreground-muted uppercase">
        {week.dates &&
          t("weekRange", formatWeekRange(week.dates[0], week.dates[5], locale))}
      </span>
      <h2 className="text-screen">
        {upcoming ? t("nextWeek") : t("thisWeek")}
      </h2>
    </div>
  );
}
