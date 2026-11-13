"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TodayButtonProps = {
  onToday: () => void;
  compact?: boolean;
  className?: string;
};

export function TodayButton({
  onToday,
  compact = false,
  className,
}: TodayButtonProps) {
  const t = useTranslations("Timetable");

  return (
    <Button
      variant="soft"
      size="sm"
      aria-keyshortcuts="T"
      className={cn(
        compact
          ? "relative h-7 px-3 text-note after:absolute after:-inset-x-1 after:-inset-y-2"
          : "px-4.5",
        className,
      )}
      onClick={onToday}
    >
      {t("today")}
    </Button>
  );
}
