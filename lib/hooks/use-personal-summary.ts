import { useTranslations } from "next-intl";
import type { Personal } from "@/lib/timetable/personal";

export function usePersonalSummary() {
  const t = useTranslations("Personal");

  return (personal: Personal, group: string | null) => {
    const parts = [
      personal.hidden.length > 0 &&
        t("hiddenCount", { count: personal.hidden.length }),
      personal.extras.length > 0 &&
        t("extrasCount", { count: personal.extras.length }),
    ].filter(Boolean);
    return [group, ...(parts.length > 0 ? parts : [t("allModules")])]
      .filter(Boolean)
      .join(" · ");
  };
}
