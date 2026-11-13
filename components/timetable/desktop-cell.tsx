"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import {
  abbreviate,
  mainTone,
  sessionKey,
  type Conflicts,
  type SlotSessions,
} from "@/lib/timetable/schedule";
import { cn } from "@/lib/utils";
import { ConflictNote } from "./conflict-note";

type DesktopCellProps = {
  cell: SlotSessions;
  group: string | null;
  current: boolean;
  free: boolean;
  conflicts: Conflicts;
  changed: ReadonlySet<string>;
  onOpen: (anchor: SheetAnchor, focus: string) => void;
};

export function DesktopCell({
  cell,
  group,
  current,
  free,
  conflicts,
  changed,
  onOpen,
}: DesktopCellProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {free && (
        <span className="flex h-8 items-center rounded-full border border-dashed border-border px-3 text-xs text-foreground-muted">
          {t("freeShort")}
        </span>
      )}

      {cell.mains.map((session) => {
        const key = sessionKey(session);
        const conflict = labels.conflict(conflicts.get(key));
        return (
          <button
            key={key}
            type="button"
            aria-haspopup="dialog"
            onClick={(event) =>
              onOpen(event.currentTarget.getBoundingClientRect(), key)
            }
            className={cn(
              "flex flex-col gap-0.5 rounded-banner px-3 py-2 text-left transition-colors duration-200 ease-out motion-reduce:transition-none",
              mainTone(session) === "cours"
                ? "bg-cours-tint text-cours-foreground hover:bg-cours-tint-strong"
                : "bg-tint text-tint-foreground hover:bg-tint-strong",
              conflict && "outline-1 outline-warning/60",
              changed.has(key) && "outline-2 outline-primary",
            )}
          >
            <span className="text-sm leading-4.75 wrap-anywhere">
              {session.module}
            </span>
            <span className="text-meta">
              {labels.meta(session, group)}
              {current && ` · ${t("now")}`}
            </span>
            {conflict && <ConflictNote text={conflict} className="pt-0.5" />}
          </button>
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
    </div>
  );
}
