"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { OverrideScope } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";

export type ScopeContext = {
  current: boolean;
  range: { start: string; end: string };
  from: string;
  until: string;
};

const OPTION =
  "flex min-h-15 w-full items-center justify-between gap-3 rounded-session px-4.5 py-3 text-left transition-[color,background-color,border-color,transform] duration-120 ease-out select-none motion-safe:active:scale-[0.98] motion-reduce:transition-none aria-disabled:pointer-events-none";

type ScopeOptionsProps = {
  context: ScopeContext;
  disabled?: boolean;
  autoFocus?: boolean;
  onChoose: (scope: OverrideScope) => void;
};

export function ScopeOptions({
  context,
  disabled = false,
  autoFocus = false,
  onChoose,
}: ScopeOptionsProps) {
  const t = useTranslations("Overrides");
  const timetable = useTranslations("Timetable");
  const { current, range, from, until } = context;
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus) first.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const options = [
    {
      scope: "week" as const,
      title: current ? t("thisWeek") : t("onlyWeekOf", range),
      hint: timetable("weekOf", range),
      className:
        "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active aria-disabled:bg-muted aria-disabled:text-foreground-muted",
    },
    {
      scope: "series" as const,
      title: current ? t("everyWeek") : t("everyWeekFrom", { date: from }),
      hint: until,
      className:
        "border border-border-strong bg-surface text-foreground hover:bg-muted active:bg-muted-hover aria-disabled:border-border aria-disabled:text-foreground-muted",
    },
  ];

  return (
    <div role="group" aria-label={t("scopeLabel")} className="flex flex-col gap-2">
      {options.map((option, index) => (
        <button
          key={option.scope}
          ref={index === 0 ? first : undefined}
          type="button"
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (!disabled) onChoose(option.scope);
          }}
          className={cn(OPTION, option.className)}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label">{option.title}</span>
            <span className="text-meta opacity-80">{option.hint}</span>
          </span>
          <ChevronRight
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 opacity-70"
          />
        </button>
      ))}
    </div>
  );
}
