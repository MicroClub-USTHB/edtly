"use client";

import { useTranslations } from "next-intl";
import { ChangeNote } from "@/components/overrides/change-note";
import { DraggableButton } from "@/components/overrides/draggable-button";
import { DropZone } from "@/components/overrides/drop-zone";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { isCancelled } from "@/lib/timetable/overrides";
import {
  abbreviate,
  mainTone,
  sessionKey,
  type Conflicts,
  type Matcher,
  type SlotSessions,
} from "@/lib/timetable/schedule";
import type { Day } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { ConflictNote } from "./conflict-note";

type DesktopCellProps = {
  day: Day;
  dayName: string;
  cell: SlotSessions;
  group: string | null;
  current: boolean;
  free: boolean;
  conflicts: Conflicts;
  changed: ReadonlySet<string>;
  editable: Matcher;
  onOpen: (anchor: SheetAnchor, focus: string) => void;
};

export function DesktopCell({
  day,
  dayName,
  cell,
  group,
  current,
  free,
  conflicts,
  changed,
  editable,
  onOpen,
}: DesktopCellProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();

  return (
    <DropZone
      id={`desktop:${day}:${cell.start}-${cell.end}`}
      target={{
        kind: "slot",
        day,
        slot: { start: cell.start, end: cell.end },
        label: `${dayName} ${cell.start}`,
      }}
      shape="cell"
      className="flex min-w-0 flex-col gap-1"
    >
      {free && (
        <span className="flex h-8 items-center rounded-full border border-dashed border-border px-3 text-xs text-foreground-muted">
          {t("freeShort")}
        </span>
      )}

      {cell.mains.map((session) => {
        const key = sessionKey(session);
        const preview = session.change?.preview;
        const cancelled = isCancelled(session);
        const conflict = labels.conflict(conflicts.get(key));
        return (
          <DraggableButton
            key={key}
            dragId={`desktop:${key}`}
            session={session}
            surface="desktop"
            label={`${session.module}, ${labels.type(session)}, ${dayName} ${session.start}`}
            draggable={!preview && !cancelled && editable(session)}
            aria-haspopup="dialog"
            data-drop-preview={preview === "target" ? "" : undefined}
            onClick={(event) =>
              onOpen(event.currentTarget.getBoundingClientRect(), key)
            }
            className={cn(
              "flex flex-col gap-0.5 rounded-banner px-3 py-2 text-left transition-[color,background-color,opacity] duration-200 ease-out motion-reduce:transition-none",
              cancelled
                ? "bg-muted text-foreground-muted hover:bg-muted-hover"
                : mainTone(session) === "cours"
                  ? "bg-cours-tint text-cours-foreground hover:bg-cours-tint-strong"
                  : "bg-tint text-tint-foreground hover:bg-tint-strong",
              conflict && "outline-1 outline-warning/60",
              changed.has(key) && "outline-2 outline-primary",
              preview === "target" && "outline-2 outline-offset-1 outline-primary",
              preview === "source" &&
                "opacity-40 outline-1 outline-offset-1 outline-border-strong outline-dashed",
            )}
          >
            <span
              className={cn(
                "text-sm leading-4.75 wrap-anywhere",
                cancelled && "line-through decoration-1",
              )}
            >
              {session.module}
            </span>
            <span className="text-meta">
              {labels.meta(session, group)}
              {current && !cancelled && ` · ${t("now")}`}
            </span>
            <ChangeNote session={session} className="pt-0.5" />
            {conflict && <ConflictNote text={conflict} className="pt-0.5" />}
          </DraggableButton>
        );
      })}

      {cell.others.map((session) => {
        const key = sessionKey(session);
        return (
          <button
            key={key}
            type="button"
            aria-haspopup="dialog"
            onClick={(event) =>
              onOpen(event.currentTarget.getBoundingClientRect(), key)
            }
            className="truncate rounded-full px-3 text-left text-xs leading-4.25 text-foreground-muted transition-colors duration-120 ease-out hover:text-foreground motion-reduce:transition-none"
          >
            {[
              labels.groups(session),
              `${labels.type(session)} ${abbreviate(session.module)}`,
              session.room,
            ]
              .filter(Boolean)
              .join(" · ")}
          </button>
        );
      })}
    </DropZone>
  );
}
