"use client";

import { ArrowUpRight, CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransitionRouter } from "next-view-transitions";
import { useState } from "react";
import { Disclaimer } from "@/components/shared/disclaimer";
import { Button, buttonVariants } from "@/components/ui/button";
import type { SheetAnchor } from "@/components/ui/sheet";
import { StateBlock } from "@/components/ui/state-block";
import { saveParcours } from "@/lib/stores/preferences";
import { localized, parcoursPath } from "@/lib/timetable/paths";
import type { CatalogueProgramme, Parcours } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { MobileHeader } from "./mobile-header";
import { ParcoursButton } from "./parcours-button";
import { ParcoursSheet } from "./parcours-sheet";

type TimetableUnreadableProps = {
  programmeLabel: string;
  pdfUrl: string;
  catalogue: CatalogueProgramme[];
};

export function TimetableUnreadable({
  programmeLabel,
  pdfUrl,
  catalogue,
}: TimetableUnreadableProps) {
  const t = useTranslations("States");
  const locale = useLocale();
  const router = useTransitionRouter();
  const [anchor, setAnchor] = useState<SheetAnchor | null>(null);

  const submit = (next: Parcours) => {
    setAnchor(null);
    saveParcours(next);
    router.push(localized(locale, parcoursPath(next)));
  };

  return (
    <main className="flex min-h-dvh w-full flex-col">
      <MobileHeader>
        <ParcoursButton label={programmeLabel} onOpen={setAnchor} />
      </MobileHeader>

      <div className="px-gutter pt-10">
        <StateBlock
          title={t("unreadableTitle")}
          description={t("unreadableBody")}
          notice={
            <p className="flex items-center gap-2 text-note text-error">
              <CircleAlert size={16} strokeWidth={1.6} aria-hidden="true" />
              {t("unreadableNotice")}
            </p>
          }
        >
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants())}
          >
            {t("openPdf")}
            <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
          </a>

          <Button variant="ghost" onClick={() => window.location.reload()}>
            {t("retry")}
          </Button>
        </StateBlock>
      </div>

      <Disclaimer className="mt-auto px-gutter pt-8 pb-5" />

      <ParcoursSheet
        open={anchor !== null}
        anchor={anchor}
        catalogue={catalogue}
        current={null}
        onSubmit={submit}
        onClose={() => setAnchor(null)}
      />
    </main>
  );
}
