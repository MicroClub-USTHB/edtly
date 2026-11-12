import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export function MobileHeader({ children }: { children: ReactNode }) {
  return (
    <header
      data-view-panel="day week"
      className="items-center justify-between gap-3 px-gutter pt-4"
    >
      <Logo className="mt-1.5 h-7.5 w-auto shrink-0 [view-transition-name:edtly-logo]" />
      {children}
    </header>
  );
}
