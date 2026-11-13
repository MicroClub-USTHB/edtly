"use client";

import { ListFilter } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import type { SheetAnchor } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type FilterButtonProps = {
  count: number;
  variant: "icon" | "label";
  onOpen: (anchor: SheetAnchor) => void;
};

export function FilterButton({ count, variant, onOpen }: FilterButtonProps) {
  const t = useTranslations("Filters");
  const label = count > 0 ? t("openActive", { count }) : t("open");

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(
        buttonVariants({
          variant: "soft",
          size: variant === "icon" ? "icon" : "sm",
        }),
        "relative",
        count > 0 &&
          "border-tint-strong bg-tint text-tint-foreground hover:bg-tint-strong",
      )}
    >
      <ListFilter size={16} strokeWidth={1.75} aria-hidden="true" />
      {variant === "label" && t("open")}
      {count > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[11px] leading-none text-primary-foreground tabular-nums",
            variant === "icon" && "absolute -top-0.5 -right-0.5",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
