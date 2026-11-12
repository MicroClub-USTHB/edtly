"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { SheetAnchor } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ParcoursButtonProps = {
  label: string;
  onOpen: (anchor: SheetAnchor) => void;
};

export function ParcoursButton({ label, onOpen }: ParcoursButtonProps) {
  const t = useTranslations("Timetable");

  return (
    <button
      type="button"
      aria-label={`${t("changeParcours")} (${label})`}
      aria-haspopup="dialog"
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(
        buttonVariants({ variant: "soft", size: "sm" }),
        "max-w-64 min-w-0 shrink gap-1.5 pr-3 pl-4",
      )}
    >
      <span className="truncate">{label}</span>
      <ChevronDown
        size={14}
        strokeWidth={1.6}
        aria-hidden="true"
        className="shrink-0"
      />
    </button>
  );
}
