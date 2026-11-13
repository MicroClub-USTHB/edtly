"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { setDay } from "@/lib/stores/view-store";
import type { NextSession } from "@/lib/timetable/schedule";
import { DAYS, type Day } from "@/lib/timetable/types";

type DayEmptyProps = {
  day: Day;
  group: string | null;
  isToday: boolean;
  filtered: boolean;
  next: NextSession | null;
  onClearFilters: () => void;
};

export function DayEmpty({
  day,
  group,
  isToday,
  filtered,
  next,
  onClearFilters,
}: DayEmptyProps) {
  const t = useTranslations("States");
  const filters = useTranslations("Filters");
  const days = useTranslations("Days.long");
  const labels = useSessionLabels();
  const when = isToday ? t("today") : days(day).toLowerCase();
  const nextDay = next ? days(DAYS[next.dayIndex]).toLowerCase() : "";

  if (filtered) {
    return (
      <div className="flex flex-col gap-3 pt-6">
        <p className="text-heading">{filters("noMatch")}</p>
        <p className="text-sm leading-5.25 text-foreground-secondary">
          {filters("noMatchBody")}
        </p>
        <Button variant="outline" className="mt-2" onClick={onClearFilters}>
          {filters("clearAll")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-6">
      <p className="text-heading">
        {group ? t("nothingFor", { when, group }) : t("nothing", { when })}
      </p>

      {next && (
        <>
          <p className="text-sm leading-5.25 text-foreground-secondary">
            {t("nextClass", {
              day: nextDay,
              time: next.session.start,
              details: [
                next.session.module,
                next.session.room && labels.room(next.session.room),
              ]
                .filter(Boolean)
                .join(", "),
            })}
          </p>

          <Button className="mt-2" onClick={() => setDay(next.dayIndex)}>
            {t("seeDay", { day: nextDay })}
          </Button>
        </>
      )}
    </div>
  );
}
