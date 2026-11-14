"use client";

import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { SheetAnchor } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ChangesButtonProps = {
  count: number;
  onOpen: (anchor: SheetAnchor) => void;
  className?: string;
};

export function ChangesButton({ count, onOpen, className }: ChangesButtonProps) {
  const t = useTranslations("Overrides");
  if (count === 0) return null;

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(buttonVariants({ variant: "soft", size: "sm" }), className)}
    >
      <CalendarClock size={15} strokeWidth={1.75} aria-hidden="true" />
      {t("changesCount", { count })}
    </button>
  );
}
