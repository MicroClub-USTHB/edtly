import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StateBlockProps = {
  title: string;
  description?: ReactNode;
  notice?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function StateBlock({
  title,
  description,
  notice,
  className,
  children,
}: StateBlockProps) {
  return (
    <div className={cn("flex max-w-110 flex-col gap-3", className)}>
      {notice}
      <h2 className="text-heading text-balance">{title}</h2>

      {description && (
        <p className="text-sm leading-5.25 text-foreground-secondary">
          {description}
        </p>
      )}

      {children && <div className="mt-2 flex flex-col gap-2">{children}</div>}
    </div>
  );
}
