import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function BannerAction({
  className,
  ...props
}: Omit<ComponentProps<"button">, "type">) {
  return (
    <button
      type="button"
      className={cn(
        "-my-3 -mr-3.5 flex min-h-11 shrink-0 items-center pr-3.5 pl-2 underline underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}
