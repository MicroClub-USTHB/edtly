import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-muted text-foreground-secondary",
  warning: "bg-warning-tint text-warning",
  success: "bg-success-tint text-success",
  error: "bg-error-tint text-error",
} as const;

type BannerProps = {
  tone?: keyof typeof tones;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Banner({
  tone = "neutral",
  icon,
  action,
  children,
  className,
}: BannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-between gap-3 rounded-banner px-3.5 py-2.5 text-note",
        tones[tone],
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span>{children}</span>
      </span>
      {action}
    </div>
  );
}
