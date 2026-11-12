"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import {
  sessionKey,
  toneOf,
  type SlotSessions,
  type SlotStatus,
} from "@/lib/timetable/schedule";
import { SessionCard } from "./session-card";

type SlotRowProps = {
  slot: SlotSessions;
  group: string | null;
  status?: SlotStatus;
  changed: ReadonlySet<string>;
  onOpen: (anchor: SheetAnchor) => void;
};

export function SlotRow({ slot, group, status, changed, onOpen }: SlotRowProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();
  const summary =
    slot.mains.length > 0
      ? slot.mains
          .map((session) => `${session.module}, ${labels.type(session)}`)
          .join(", ")
      : t("free");

  return (
    <li className="flex gap-3">
      <span className="flex w-10.5 shrink-0 flex-col gap-0.5 pt-3 tabular-nums">
        <span className="text-[13px] leading-5">{slot.start}</span>
        <span className="text-xs text-foreground-muted">{slot.end}</span>
      </span>

      <button
        type="button"
        aria-label={`${slot.start}, ${summary}. ${t("seeAllGroups")}`}
        aria-haspopup="dialog"
        onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
        className="group flex min-w-0 flex-1 flex-col gap-1.25 rounded-session text-left"
      >
        {slot.mains.map((session) => {
          const tone = toneOf(session, group);
          return (
            <SessionCard
              key={sessionKey(session)}
              title={session.module}
              meta={labels.meta(session)}
              tone={tone === "cours" ? "cours" : "mine"}
              status={status}
              statusLabel={status && t(status)}
              flash={changed.has(sessionKey(session))}
            />
          );
        })}

        {slot.mains.length === 0 && (
          <span className="flex h-9 items-center self-stretch rounded-full border border-dashed border-border px-4 text-note text-foreground-muted group-active:bg-muted">
            {group ? t("freeFor", { group }) : t("free")}
          </span>
        )}

        {slot.others.length > 0 && (
          <span className="flex items-center gap-1.5 self-stretch pr-1 pl-4 text-xs text-foreground-muted">
            <span className="min-w-0 flex-1 truncate">
              {slot.others.map(labels.short).join(" · ")}
            </span>
            <ChevronRight
              size={12}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0"
            />
          </span>
        )}
      </button>
    </li>
  );
}
