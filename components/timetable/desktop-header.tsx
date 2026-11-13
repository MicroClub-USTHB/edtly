"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LangToggle } from "@/components/shared/lang-toggle";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DesktopHeaderProps = {
  updated: string;
  pdfUrl: string;
  children: ReactNode;
};

export function DesktopHeader({ updated, pdfUrl, children }: DesktopHeaderProps) {
  const t = useTranslations("Timetable");

  return (
    <header className="flex flex-wrap items-center gap-3">
      <Logo className="mt-1.5 h-8 w-auto shrink-0 [view-transition-name:edtly-logo]" />

      {children}

      <span className="flex-1" />

      {updated && (
        <span className="hidden text-note text-foreground-muted min-[1440px]:inline">
          {t("updatedOn", { date: updated })}
        </span>
      )}

      <a
        href={pdfUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: "soft", size: "sm" }))}
      >
        {t("officialPdf")}
        <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
      </a>

      <LangToggle id="lang-desktop" size="icon" />
      <ModeToggle id="theme-desktop" variant="icons" />
    </header>
  );
}
