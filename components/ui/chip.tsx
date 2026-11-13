import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ChipProps = Omit<ComponentProps<"button">, "type"> & {
  selected: boolean;
};

export function Chip({ selected, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "min-h-11 min-w-14 rounded-full border px-4 text-label select-none transition-colors duration-120 ease-out motion-reduce:transition-none",
        selected
          ? "border-tint-strong bg-tint text-tint-foreground"
          : "border-border bg-surface text-foreground hover:border-border-strong active:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
