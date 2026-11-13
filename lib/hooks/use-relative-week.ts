import { useTranslations } from "next-intl";

export function useRelativeWeek() {
  const t = useTranslations("Timetable");

  return (offset: number) =>
    offset > 0
      ? t("weeksAhead", { count: offset })
      : t("weeksBehind", { count: -offset });
}
