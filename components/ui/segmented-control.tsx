"use client";

import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  id: string;
  label: string;
  options: readonly SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  size?: keyof typeof sizes;
  className?: string;
};

const sizes = {
  md: "h-11 min-w-0 flex-1 text-label",
  sm: "h-9 w-15 text-sm",
  compact: "h-9 px-4 text-sm",
  icon: "size-9",
} as const;

export function SegmentedControl<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex gap-1 rounded-full bg-muted p-1", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex items-center justify-center rounded-full select-none transition-colors duration-120 ease-out motion-reduce:transition-none",
              sizes[size],
              selected
                ? "text-tint-foreground"
                : "text-foreground-secondary hover:bg-muted-hover hover:text-foreground active:bg-border",
            )}
          >
            {selected && (
              <m.span
                layoutId={id}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-tint"
                transition={{ duration: 0.2, ease: EASE_OUT }}
              />
            )}

            <span className="relative flex items-center truncate">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
