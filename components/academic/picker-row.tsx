"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Chip } from "@/components/ui/chip";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type PickerOption = { value: string; label: string };

type PickerRowProps = {
  label: string;
  options: PickerOption[];
  value: string | null;
  first?: boolean;
  onPick: (value: string) => void;
};

export function PickerRow({
  label,
  options,
  value,
  first = false,
  onPick,
}: PickerRowProps) {
  const reduced = useReducedMotion();
  const transition = {
    duration: reduced ? 0 : DURATION.base,
    ease: EASE_OUT,
  };

  return (
    <m.div
      role="group"
      aria-label={label}
      className="-mx-1 -mb-1 overflow-hidden px-1"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={transition}
    >
      <div className={cn("flex flex-col gap-2 pb-1", !first && "pt-5")}>
        <span className="text-overline text-foreground-muted uppercase">
          {label}
        </span>

        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Chip
              key={option.value}
              selected={option.value === value}
              onClick={() => onPick(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>
    </m.div>
  );
}
