"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { formatWeekRange } from "@/lib/format";
import type { Week } from "@/lib/hooks/use-week";
import { TodayButton } from "./today-button";

type DesktopToolbarProps = {
  week: Week;
  onShift: (delta: number) => void;
  onToday: () => void;
  children?: ReactNode;
};

export function DesktopToolbar({
  week,
  onShift,
  onToday,
  children,
}: DesktopToolbarProps) {
  const t = useTranslations("Timetable");
  const locale = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="min-h-8 text-screen">
        {week.dates &&
          t("weekOf", formatWeekRange(week.dates[0], week.dates[5], locale))}
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        {children}

        <Button
          variant="soft"
          size="icon"
          aria-label={t("previousWeek")}
          aria-keyshortcuts="ArrowLeft"
          onClick={() => onShift(-1)}
        >
          <ChevronLeft size={16} strokeWidth={1.6} aria-hidden="true" />
        </Button>

        <TodayButton onToday={onToday} />

        <Button
          variant="soft"
          size="icon"
          aria-label={t("followingWeek")}
          aria-keyshortcuts="ArrowRight"
          onClick={() => onShift(1)}
        >
          <ChevronRight size={16} strokeWidth={1.6} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
