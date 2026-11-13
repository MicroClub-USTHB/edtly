"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { todayIndex } from "@/lib/dates";
import { formatWeekRange } from "@/lib/format";
import { useRelativeWeek } from "@/lib/hooks/use-relative-week";
import type { Week } from "@/lib/hooks/use-week";

type WeekTitleProps = {
  week: Week;
  weekOffset: number;
  onShift: (delta: number) => void;
  onToday: () => void;
};

export function WeekTitle({
  week,
  weekOffset,
  onShift,
  onToday,
}: WeekTitleProps) {
  const t = useTranslations("Timetable");
  const locale = useLocale();
  const relativeWeek = useRelativeWeek();
  const upcoming = week.now !== null && todayIndex(week.now) === null;
  const title =
    weekOffset !== 0
      ? relativeWeek(weekOffset)
      : upcoming
        ? t("nextWeek")
        : t("thisWeek");

  return (
    <div data-view-panel="week" className="items-end gap-3 px-gutter pt-5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="min-h-4 text-overline text-foreground-muted uppercase">
          {week.dates &&
            t(
              "weekRange",
              formatWeekRange(week.dates[0], week.dates[5], locale),
            )}
        </span>
        <h2 className="text-screen">{title}</h2>
        {weekOffset !== 0 && (
          <Button
            variant="link"
            size="sm"
            className="-ml-4 self-start"
            onClick={onToday}
          >
            {t("today")}
          </Button>
        )}
      </div>

      <div className="mb-0.5 flex shrink-0 gap-2">
        <Button
          variant="soft"
          size="icon"
          aria-label={t("previousWeek")}
          onClick={() => onShift(-1)}
        >
          <ChevronLeft size={16} strokeWidth={1.6} aria-hidden="true" />
        </Button>
        <Button
          variant="soft"
          size="icon"
          aria-label={t("followingWeek")}
          onClick={() => onShift(1)}
        >
          <ChevronRight size={16} strokeWidth={1.6} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
