import { useTranslations } from "next-intl";
import type { Personal } from "@/lib/timetable/personal";

export function usePersonalSummary() {
  const t = useTranslations("Personal");
  const timetable = useTranslations("Timetable");

  return (personal: Personal, group: string | null, conflicts = 0) => {
    const parts = [
      personal.hidden.length > 0 &&
        t("hiddenCount", { count: personal.hidden.length }),
      personal.extras.length > 0 &&
        t("extrasCount", { count: personal.extras.length }),
    ].filter(Boolean);
    const warning =
      conflicts > 0 ? [timetable("conflictCount", { count: conflicts })] : [];
    return [
      group,
      ...(parts.length > 0 ? parts : [t("allModules")]),
      ...warning,
    ]
      .filter(Boolean)
      .join(" · ");
  };
}
