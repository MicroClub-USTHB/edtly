"use client";

import { CalendarPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { SheetAnchor } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type CalendarButtonProps = {
  variant: "icon" | "label";
  onOpen: (anchor: SheetAnchor) => void;
  className?: string;
};

export function CalendarButton({
  variant,
  onOpen,
  className,
}: CalendarButtonProps) {
  const t = useTranslations("Calendar");

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={variant === "icon" ? t("open") : undefined}
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(
        buttonVariants({
          variant: "soft",
          size: variant === "icon" ? "icon" : "sm",
        }),
        className,
      )}
    >
      <CalendarPlus size={16} strokeWidth={1.75} aria-hidden="true" />
      {variant === "label" && t("open")}
    </button>
  );
}
