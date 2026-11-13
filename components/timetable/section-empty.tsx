"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { SheetAnchor } from "@/components/ui/sheet";
import { StateBlock } from "@/components/ui/state-block";

type SectionEmptyProps = {
  programme: string;
  onChangeSection: (anchor: SheetAnchor) => void;
};

export function SectionEmpty({
  programme,
  onChangeSection,
}: SectionEmptyProps) {
  const t = useTranslations("States");

  return (
    <StateBlock
      title={t("emptyTitle")}
      description={t("emptyBody", { programme })}
    >
      <Button
        variant="outline"
        aria-haspopup="dialog"
        onClick={(event) =>
          onChangeSection(event.currentTarget.getBoundingClientRect())
        }
      >
        {t("changeSection")}
      </Button>
    </StateBlock>
  );
}
