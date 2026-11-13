"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActiveFiltersProps = {
  labels: string[];
  onClear: () => void;
  className?: string;
};

export function ActiveFilters({
  labels,
  onClear,
  className,
}: ActiveFiltersProps) {
  const t = useTranslations("Filters");
  if (labels.length === 0) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex min-h-11 items-center justify-between gap-3",
        className,
      )}
    >
      <p className="min-w-0 text-note text-foreground-secondary">
        {t("active", { list: labels.join(", ") })}
      </p>
      <Button
        variant="link"
        size="sm"
        className="-mr-4 shrink-0"
        onClick={onClear}
      >
        {t("clear")}
      </Button>
    </div>
  );
}
