"use client";

import { useTranslations } from "next-intl";
import { DropSegments } from "@/components/overrides/drop-segments";
import { useDuration } from "@/lib/hooks/use-duration";
import type { Gap, Slot } from "@/lib/timetable/schedule";
import type { Day } from "@/lib/timetable/types";

type GapRowProps = {
  gap: Gap;
  day: Day;
  dayName: string;
  zones: Slot[] | null;
  active: boolean;
};

export function GapRow({ gap, day, dayName, zones, active }: GapRowProps) {
  const t = useTranslations("Timetable");
  const duration = useDuration();

  return (
    <li className="flex gap-3">
      <span className="w-10.5 shrink-0 pt-2 text-[13px] leading-5 text-foreground-muted tabular-nums">
        {gap.start}
      </span>

      {zones ? (
        <DropSegments
          day={day}
          dayName={dayName}
          slots={zones}
          active={active}
          className="flex-1"
        />
      ) : (
        <span className="flex min-h-9 flex-1 items-center rounded-full border border-dashed border-border px-4 text-note text-foreground-muted">
          {t("freeGap", { duration: duration(gap.minutes) })}
        </span>
      )}
    </li>
  );
}
