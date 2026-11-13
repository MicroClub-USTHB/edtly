"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StateBlock } from "@/components/ui/state-block";

export function MineEmpty({ onCustomize }: { onCustomize: () => void }) {
  const t = useTranslations("Personal");

  return (
    <StateBlock title={t("emptyTitle")} description={t("emptyBody")}>
      <Button variant="outline" aria-haspopup="dialog" onClick={onCustomize}>
        <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
        {t("customize")}
      </Button>
    </StateBlock>
  );
}
