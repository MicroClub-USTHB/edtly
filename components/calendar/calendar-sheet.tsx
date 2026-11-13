"use client";

import { CalendarPlus, Info, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import { feedUrl, googleSubscribeUrl } from "@/lib/calendar/links";
import { CalendarNote } from "./calendar-note";
import { SubscribeLink } from "./subscribe-link";

type CalendarSheetProps = {
  open: boolean;
  anchor: SheetAnchor | null;
  token: string;
  label: string;
  summary: string;
  count: number | null;
  onClose: () => void;
};

export function CalendarSheet({
  open,
  anchor,
  token,
  label,
  summary,
  count,
  onClose,
}: CalendarSheetProps) {
  const t = useTranslations("Calendar");
  const personal = useTranslations("Personal");
  const session = useTranslations("Session");
  const url = feedUrl(token);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t("title")}
      closeLabel={session("close")}
      anchor={anchor}
      heading={<h2 className="text-heading">{t("title")}</h2>}
    >
      <div className="flex flex-col gap-1 rounded-session bg-tint px-4.5 py-4 text-tint-foreground">
        <span className="text-overline uppercase">{personal("mine")}</span>
        <p className="text-label wrap-anywhere">{label}</p>
        <p className="text-note">
          {[summary, count !== null && t("perWeek", { count })]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <a
        href={googleSubscribeUrl(url)}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ variant: "primary" })}
      >
        <CalendarPlus size={17} strokeWidth={1.75} aria-hidden="true" />
        {t("google")}
      </a>

      <SubscribeLink url={url} />

      <ul className="flex flex-col gap-2.5 pb-1">
        <CalendarNote icon={RefreshCw}>{t("autoUpdate")}</CalendarNote>
        <CalendarNote icon={Info}>{t("snapshot")}</CalendarNote>
      </ul>
    </Sheet>
  );
}
