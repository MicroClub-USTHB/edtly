"use client";

import { useTranslations } from "next-intl";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import type { CatalogueProgramme, Session } from "@/lib/timetable/types";
import { PersonalEditor } from "./personal-editor";

type PersonalSheetProps = {
  open: boolean;
  anchor: SheetAnchor | null;
  path: string;
  sectionLabel: string;
  sessions: Session[];
  groups: string[];
  mainGroup: string | null;
  tpGroups: string[];
  tpGroup: string | null;
  catalogue: CatalogueProgramme[];
  onMainGroupChange: (group: string) => void;
  onTpGroupChange: (group: string) => void;
  onClose: () => void;
};

export function PersonalSheet({
  open,
  anchor,
  onClose,
  ...editor
}: PersonalSheetProps) {
  const t = useTranslations("Personal");
  const session = useTranslations("Session");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t("title")}
      closeLabel={session("close")}
      anchor={anchor}
      size="wide"
      heading={<h2 className="text-heading">{t("title")}</h2>}
    >
      <PersonalEditor {...editor} />
    </Sheet>
  );
}
