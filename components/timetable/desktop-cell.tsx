"use client";

import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import {
  abbreviate,
  sessionKey,
  toneOf,
  type SlotSessions,
} from "@/lib/timetable/schedule";
import { cn } from "@/lib/utils";

type DesktopCellProps = {
  cell: SlotSessions;
  group: string | null;
  current: boolean;
  changed: ReadonlySet<string>;
  onOpen: (anchor: SheetAnchor, focus: string) => void;
};

export function DesktopCell({
  cell,
  group,
  current,
  changed,
  onOpen,
}: DesktopCellProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {cell.mains.map((session) => {
        const key = sessionKey(session);
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
              toneOf(session, group) === "cours"
                ? "bg-cours-tint text-cours-foreground hover:bg-cours-tint-strong"
                : "bg-tint text-tint-foreground hover:bg-tint-strong",
              changed.has(key) && "outline-2 outline-primary",
            )}
          >
            <span className="text-sm leading-4.75 wrap-anywhere">
              {session.module}
            </span>
            <span className="text-meta">
              {labels.meta(session)}
              {current && ` · ${t("now")}`}
            </span>
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
