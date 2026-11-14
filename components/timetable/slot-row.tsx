"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChangeNote } from "@/components/overrides/change-note";
import { DraggableButton } from "@/components/overrides/draggable-button";
import { DropZone } from "@/components/overrides/drop-zone";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { isCancelled } from "@/lib/timetable/overrides";
import {
  mainTone,
  sessionKey,
  type Conflicts,
  type Matcher,
  type SlotSessions,
  type SlotStatus,
} from "@/lib/timetable/schedule";
import type { Day } from "@/lib/timetable/types";
import { SessionCard } from "./session-card";

type SlotRowProps = {
  day: Day;
  dayName: string;
  slot: SlotSessions;
  group: string | null;
  status?: SlotStatus;
  conflicts: Conflicts;
  changed: ReadonlySet<string>;
  editable: Matcher;
  active: boolean;
  onOpen: (anchor: SheetAnchor, focus?: string) => void;
};

export function SlotRow({
  day,
  dayName,
  slot,
  group,
  status,
  conflicts,
  changed,
  editable,
  active,
  onOpen,
}: SlotRowProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();
  const changes = useChangeLabels();

  return (
    <li className="flex gap-3">
      <span className="flex w-10.5 shrink-0 flex-col gap-0.5 pt-3 tabular-nums">
        <span className="text-[13px] leading-5">{slot.start}</span>
        <span className="text-xs text-foreground-muted">{slot.end}</span>
      </span>

      <DropZone
        id={`day:${day}:${slot.start}-${slot.end}`}
        target={{
          kind: "slot",
          day,
          slot: { start: slot.start, end: slot.end },
          label: `${dayName} ${slot.start}`,
        }}
        disabled={!active}
        shape="row"
        className="flex min-w-0 flex-1 flex-col gap-1.25"
      >
        {slot.mains.map((session) => {
          const key = sessionKey(session);
          const preview = session.change?.preview;
          const cancelled = isCancelled(session);
          const conflict = labels.conflict(conflicts.get(key));
          return (
            <DraggableButton
              key={key}
              dragId={`day:${key}`}
              session={session}
              surface="day"
              label={`${session.module}, ${labels.type(session)}, ${dayName} ${session.start}`}
              draggable={!preview && !cancelled && editable(session)}
              aria-haspopup="dialog"
              aria-label={[
                `${slot.start}, ${session.module}, ${labels.type(session)}`,
                changes.status(session),
                conflict && t("conflictShort"),
              ]
                .filter(Boolean)
                .join(", ")}
              data-drop-preview={preview === "target" ? "" : undefined}
              onClick={(event) =>
                onOpen(event.currentTarget.getBoundingClientRect(), key)
              }
              className="group flex min-w-0 flex-col rounded-session text-left"
            >
              <SessionCard
                title={session.module}
                meta={labels.meta(session, group)}
                tone={mainTone(session)}
                status={status}
                statusLabel={status && t(status)}
                conflict={conflict}
                flash={changed.has(key)}
                cancelled={cancelled}
                preview={preview}
                note={<ChangeNote session={session} className="pt-0.5" />}
              />
            </DraggableButton>
          );
        })}

        {slot.mains.length === 0 && (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={`${slot.start}, ${t("free")}. ${t("seeAllGroups")}`}
            onClick={(event) =>
              onOpen(event.currentTarget.getBoundingClientRect())
            }
            className="group flex h-9 items-center self-stretch rounded-full border border-dashed border-border px-4 text-left text-note text-foreground-muted active:bg-muted"
          >
            {group ? t("freeFor", { group }) : t("free")}
          </button>
        )}

        {slot.others.length > 0 && (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={`${slot.start}, ${t("otherSessions", { count: slot.others.length })}. ${t("seeAllGroups")}`}
            onClick={(event) =>
              onOpen(event.currentTarget.getBoundingClientRect())
            }
            className="flex items-center gap-1.5 self-stretch rounded-full pr-1 pl-4 text-left text-xs text-foreground-muted"
          >
            <span className="min-w-0 flex-1 truncate">
              {slot.others.map(labels.short).join(" · ")}
            </span>
            <ChevronRight
              size={12}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0"
            />
          </button>
        )}
      </DropZone>
    </li>
  );
}
