"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransitionRouter } from "next-view-transitions";
import { saveParcours } from "@/lib/stores/preferences";
import { localized, parcoursUrl } from "@/lib/timetable/paths";
import type { CatalogueProgramme, Parcours } from "@/lib/timetable/types";
import { ParcoursPicker } from "./parcours-picker";

export function Onboarding({ catalogue }: { catalogue: CatalogueProgramme[] }) {
  const t = useTranslations("Picker");
  const locale = useLocale();
  const router = useTransitionRouter();

  const submit = (parcours: Parcours) => {
    saveParcours(parcours);
    router.push(localized(locale, parcoursUrl(parcours)));
  };

  return (
    <ParcoursPicker
      catalogue={catalogue}
      submitLabel={t("submit")}
      onSubmit={submit}
    />
  );
}
