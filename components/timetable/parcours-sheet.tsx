"use client";

import { useTranslations } from "next-intl";
import { ParcoursPicker } from "@/components/academic/parcours-picker";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import type { CatalogueProgramme, Parcours } from "@/lib/timetable/types";

type ParcoursSheetProps = {
  open: boolean;
  anchor: SheetAnchor | null;
  catalogue: CatalogueProgramme[];
  current: Parcours | null;
  onSubmit: (parcours: Parcours) => void;
  onClose: () => void;
};

export function ParcoursSheet({
  open,
  anchor,
  catalogue,
  current,
  onSubmit,
  onClose,
}: ParcoursSheetProps) {
  const t = useTranslations("Picker");
  const session = useTranslations("Session");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t("title")}
      closeLabel={session("close")}
      anchor={anchor}
      heading={<h2 className="text-heading">{t("title")}</h2>}
    >
      <ParcoursPicker
        catalogue={catalogue}
        initial={current}
        submitLabel={t("apply")}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}
