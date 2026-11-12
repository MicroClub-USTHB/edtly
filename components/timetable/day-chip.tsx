"use client";

import * as m from "motion/react-m";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type DayChipProps = {
  index: number;
  label: string;
  name: string;
  date: number | null;
  today: boolean;
  selected: boolean;
  onSelect: () => void;
};

export function DayChip({
  index,
  label,
  name,
  date,
  today,
  selected,
  onSelect,
}: DayChipProps) {
  return (
    <button
      type="button"
      data-today-mark={index}
      aria-label={date === null ? name : `${name} ${date}`}
      aria-pressed={selected}
      aria-current={today ? "date" : undefined}
      onClick={onSelect}
      className={cn(
        "relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-px rounded-chip transition-colors duration-120 ease-out motion-reduce:transition-none",
        today
          ? "bg-primary text-primary-foreground"
          : selected
            ? "text-tint-foreground"
            : "text-foreground-secondary hover:bg-muted active:bg-muted-hover",
      )}
    >
      {selected && !today && (
        <m.span
          layoutId="day-chip"
          aria-hidden="true"
          className="absolute inset-0 rounded-chip bg-tint"
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
        />
      )}

      <span
        className={cn(
          "relative text-overline uppercase",
          !today && !selected && "text-foreground-muted",
        )}
      >
        {label}
      </span>
      <span className="relative text-[17px] leading-5.5 tabular-nums">
        {date ?? " "}
      </span>
    </button>
  );
}
