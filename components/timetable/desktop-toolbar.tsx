"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatWeekRange } from "@/lib/format";
import type { Week } from "@/lib/hooks/use-week";

type DesktopToolbarProps = {
  week: Week;
  onShift: (delta: number) => void;
  onToday: () => void;
};

export function DesktopToolbar({ week, onShift, onToday }: DesktopToolbarProps) {
  const t = useTranslations("Timetable");
  const locale = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="min-h-8 text-screen">
        {week.dates &&
          t("weekOf", formatWeekRange(week.dates[0], week.dates[5], locale))}
      </h2>

      <div className="flex items-center gap-2">
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
          size="sm"
          className="px-4.5"
          onClick={onToday}
        >
          {t("today")}
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
