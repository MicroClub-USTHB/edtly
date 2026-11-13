import { useTranslations } from "next-intl";
import { levelLabel } from "@/lib/timetable/paths";

type Labelled = {
  level: string;
  specialityName: string;
  sectionName: string;
  sectionCount: number;
};

export function useSectionLabel() {
  const t = useTranslations("Timetable");

  return ({ level, specialityName, sectionName, sectionCount }: Labelled) =>
    [
      `${levelLabel(level)} ${specialityName}`,
      sectionCount > 1 && t("sectionLabel", { name: sectionName }),
    ]
      .filter(Boolean)
      .join(" · ");
}
