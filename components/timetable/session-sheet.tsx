"use client";

import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, type SheetAnchor } from "@/components/ui/sheet";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import {
  sessionKey,
  toneOf,
  type SlotSessions,
  type SlotStatus,
} from "@/lib/timetable/schedule";
import type { Day } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";

export type SessionDetail = {
  day: Day;
  slot: SlotSessions;
  focus: string | null;
  status?: SlotStatus;
  anchor: SheetAnchor | null;
};

type SessionSheetProps = {
  detail: SessionDetail | null;
  group: string | null;
  sectionName: string;
  pdfUrl: string;
  onFocus: (key: string) => void;
  onClose: () => void;
};

const tones = {
  cours: "bg-cours-tint text-cours-foreground",
  mine: "bg-tint text-tint-foreground",
  other: "bg-muted text-foreground",
} as const;

export function SessionSheet({
  detail,
  group,
  sectionName,
  pdfUrl,
  onFocus,
  onClose,
}: SessionSheetProps) {
  const t = useTranslations("Session");
  const timetable = useTranslations("Timetable");
  const days = useTranslations("Days.long");
  const labels = useSessionLabels();

  const all = detail ? [...detail.slot.mains, ...detail.slot.others] : [];
  const focused =
    all.find((session) => sessionKey(session) === detail?.focus) ??
    detail?.slot.mains[0];
  const rest = all.filter((session) => session !== focused);
  const tone = focused ? toneOf(focused, group) : "other";
  const audience = !focused
    ? ""
    : focused.groups.length > 0
      ? labels.audience(focused)
      : sectionName
        ? timetable("sectionLabel", { name: sectionName })
        : t("wholeSection");

  const facts = focused
    ? [
        { label: t("room"), value: focused.room || "—" },
        ...(detail?.status && tone !== "other"
          ? [{ label: t("status"), value: timetable(detail.status) }]
          : []),
      ]
    : [];

  return (
    <Sheet
      open={detail !== null}
      onClose={onClose}
      label={t("title")}
      closeLabel={t("close")}
      anchor={detail?.anchor}
      heading={
        <span className="text-overline text-foreground-muted uppercase">
          {detail &&
            `${days(detail.day)} · ${detail.slot.start} – ${detail.slot.end}`}
        </span>
      }
    >
      {focused ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-session px-4.5 py-4",
            tones[tone],
          )}
        >
          <div className="flex flex-col gap-0.5">
            <h2 className="text-heading wrap-anywhere">{focused.module}</h2>
            <p className="text-note">
              {[labels.type(focused), audience].filter(Boolean).join(" · ")}
            </p>
          </div>

          <dl className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-3">
            {facts.map((fact) => (
              <div key={fact.label} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-overline uppercase">{fact.label}</dt>
                <dd className="text-label wrap-anywhere">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="flex h-9 items-center rounded-full border border-dashed border-border px-4 text-note text-foreground-muted">
          {group ? timetable("freeFor", { group }) : timetable("free")}
        </p>
      )}

      {rest.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-overline text-foreground-muted uppercase">
            {t("sameSlot")}
          </h3>

          <ul className="flex flex-col">
            {rest.map((session) => (
              <li
                key={sessionKey(session)}
                className="border-b border-divider last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onFocus(sessionKey(session))}
                  className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                >
                  <span className="flex h-7 min-w-10 shrink-0 items-center justify-center rounded-full bg-muted px-2 text-note text-foreground-secondary">
                    {labels.groups(session) || labels.type(session)}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="text-sm wrap-anywhere">
                      {session.module}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {labels.meta(session)}
                    </span>
                  </span>

                  <ChevronRight
                    size={14}
                    strokeWidth={1.6}
                    aria-hidden="true"
                    className="shrink-0 text-foreground-muted"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={pdfUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        {t("openPdf")}
        <ArrowUpRight size={14} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </Sheet>
  );
}
