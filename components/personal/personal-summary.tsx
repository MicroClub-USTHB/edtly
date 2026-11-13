"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { SheetAnchor } from "@/components/ui/sheet";

type PersonalSummaryProps = {
  summary: string;
  onCustomize: (anchor: SheetAnchor) => void;
};

export function PersonalSummary({ summary, onCustomize }: PersonalSummaryProps) {
  const t = useTranslations("Personal");

  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <p className="min-w-0 text-note text-foreground-secondary">
        {summary}
      </p>

      <Button
        variant="link"
        size="sm"
        aria-haspopup="dialog"
        className="-mr-4 gap-1.5"
        onClick={(event) =>
          onCustomize(event.currentTarget.getBoundingClientRect())
        }
      >
        <SlidersHorizontal size={15} strokeWidth={1.75} aria-hidden="true" />
        {t("customize")}
      </Button>
    </div>
  );
}
