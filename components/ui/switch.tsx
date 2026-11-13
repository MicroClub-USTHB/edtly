import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "onChange" | "children"
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group -m-2 flex size-15 shrink-0 items-center justify-center rounded-full",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex h-7 w-11.5 items-center rounded-full p-0.75 transition-colors duration-200 ease-out motion-reduce:transition-none",
          checked ? "bg-primary" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "size-5.5 rounded-full bg-white shadow-[0_1px_3px_rgb(30_22_21/0.24)] transition-transform duration-200 ease-out motion-reduce:transition-none",
            checked && "translate-x-4.5",
          )}
        />
      </span>
    </button>
  );
}
