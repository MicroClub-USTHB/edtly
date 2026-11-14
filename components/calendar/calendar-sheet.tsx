"use client";

import {
  ArrowUpRight,
  CalendarPlus,
  Info,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Banner } from "@/components/ui/banner";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import { formatShortDate } from "@/lib/format";
import { feedUrl, googleSubscribeUrl } from "@/lib/calendar/links";
import {
  markCalendarOpened,
  useCalendarOpened,
} from "@/lib/stores/calendar-store";
import { cn } from "@/lib/utils";
import { CalendarNote } from "./calendar-note";
import { SubscribeLink } from "./subscribe-link";

export type CalendarIntent = "add" | "update";

const GOOGLE_SETTINGS = "https://calendar.google.com/calendar/r/settings";

type CalendarSheetProps = {
  open: boolean;
  anchor: SheetAnchor | null;
  intent: CalendarIntent;
  path: string;
  token: string;
  label: string;
  summary: string;
  count: number | null;
  changes: number;
  onClose: () => void;
};

export function CalendarSheet({
  open,
  anchor,
  intent,
  path,
  token,
  label,
  summary,
  count,
  changes,
  onClose,
}: CalendarSheetProps) {
  const t = useTranslations("Calendar");
  const personal = useTranslations("Personal");
  const session = useTranslations("Session");
  const locale = useLocale();
  const opened = useCalendarOpened(path);
  const url = feedUrl(token);
  const current = opened?.token === token;
  const stale = opened !== null && !current;
  const updating = !current && (stale || intent === "update");
  const title = intent === "update" ? t("updateTitle") : t("title");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={title}
      closeLabel={session("close")}
      anchor={anchor}
      heading={<h2 className="text-heading">{title}</h2>}
    >
      <div className="flex flex-col gap-1 rounded-session bg-tint px-4.5 py-4 text-tint-foreground">
        <span className="text-overline uppercase">{personal("mine")}</span>
        <p className="text-label wrap-anywhere">{label}</p>
        <p className="text-note">
          {[
            summary,
            count !== null && t("perWeek", { count }),
            changes > 0 && t("changesCount", { count: changes }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {updating && (
        <Banner
          tone="warning"
          icon={
            <TriangleAlert
              size={15}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0"
            />
          }
        >
          {stale ? `${t("staleNotice")} ${t("updateNotice")}` : t("updateNotice")}
        </Banner>
      )}

      <a
        href={googleSubscribeUrl(url)}
        target="_blank"
        rel="noreferrer"
        onClick={() => markCalendarOpened(path, token)}
        className={buttonVariants({ variant: "primary" })}
      >
        <CalendarPlus size={17} strokeWidth={1.75} aria-hidden="true" />
        {updating ? t("googleUpdated") : t("google")}
      </a>

      <p role="status" className={cn("text-note text-foreground-secondary", !current && "sr-only")}>
        {current &&
          t("opened", { date: formatShortDate(new Date(opened.at), locale) })}
      </p>

      {updating && (
        <div className="flex flex-col gap-2 rounded-session bg-muted px-4.5 py-3.5">
          <p className="text-note text-foreground-secondary">{t("removeOld")}</p>
          <a
            href={GOOGLE_SETTINGS}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 self-start text-note text-primary hover:text-primary-hover"
          >
            {t("openSettings")}
            <ArrowUpRight size={13} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </div>
      )}

      <SubscribeLink url={url} />

      <ul className="flex flex-col gap-2.5 pb-1">
        <CalendarNote icon={RefreshCw}>{t("autoUpdate")}</CalendarNote>
        <CalendarNote icon={Info}>{t("snapshot")}</CalendarNote>
      </ul>
    </Sheet>
  );
}
