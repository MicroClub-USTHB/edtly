import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-label transition-colors duration-120 ease-out select-none motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active aria-disabled:pointer-events-none aria-disabled:bg-muted aria-disabled:text-foreground-muted",
        outline:
          "border border-border-strong bg-surface text-foreground hover:bg-muted active:bg-muted-hover",
        soft: "border border-border bg-surface text-foreground hover:bg-muted active:bg-muted-hover",
        ghost: "text-foreground hover:bg-muted active:bg-muted-hover",
        link: "text-primary hover:text-primary-hover active:text-primary-active",
      },
      size: {
        lg: "h-13 px-5",
        md: "h-12 px-5",
        sm: "h-11 px-4 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
