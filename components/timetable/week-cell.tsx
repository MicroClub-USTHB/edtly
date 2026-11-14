"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { DraggableButton } from "@/components/overrides/draggable-button";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { isCancelled } from "@/lib/timetable/overrides";
import {
  compactLabel,
  mainTone,
  occupies,
  sessionKey,
  type Matcher,
  type SlotSessions,
} from "@/lib/timetable/schedule";
import type { Day } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";

type WeekCellProps = {
  cell: SlotSessions;
  day: Day;
  dayName: string;
  conflict: boolean;
  free: boolean;
  editable: Matcher;
  onOpen: (anchor: SheetAnchor) => void;
};

export function WeekCell({
  cell,
  day,
  dayName,
  conflict,
  free,
  editable,
  onOpen,
}: WeekCellProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();
  const changes = useChangeLabels();
  const [main] = [...cell.mains].sort(
    (a, b) => Number(occupies(b)) - Number(occupies(a)),
  );
  const extra = cell.mains.length + cell.others.length - (main ? 1 : 0);

  if (!main && extra === 0) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex-1",
          free && "rounded-cell border border-dashed border-border",
        )}
      />
    );
  }

  const preview = main?.change?.preview;
  const cancelled = main ? isCancelled(main) : false;
  const status = main ? changes.status(main) : null;
  const tone = !main ? "other" : cancelled ? "cancelled" : mainTone(main);
  const label = main
    ? [
        `${dayName} ${cell.start}, ${main.module}, ${labels.type(main)}`,
        status,
        conflict && t("conflictShort"),
      ]
        .filter(Boolean)
        .join(", ")
    : `${dayName} ${cell.start}, ${t("otherSessions", { count: extra })}`;

  const content = main ? (
    <>
      <span
        className={cn(
          "line-clamp-2 text-tab wrap-anywhere min-[600px]:hidden",
          cancelled && "line-through",
        )}
      >
        {compactLabel(main.module)}
      </span>
      <span
        className={cn(
          "line-clamp-2 hidden text-xs wrap-anywhere min-[600px]:block",
          cancelled && "line-through",
        )}
      >
        {main.module}
      </span>
      <span className="truncate text-tab">{labels.type(main)}</span>
      {extra > 0 && <span className="mt-auto text-tab">+{extra}</span>}
    </>
  ) : (
    <>
      <span className="text-tab min-[600px]:text-xs">+{extra}</span>
      <span className="truncate text-tab">{t("others")}</span>
    </>
  );

  return (
    <DraggableButton
      dragId={`week:${main ? sessionKey(main) : `${day}:${cell.start}`}`}
      session={main ?? cell.others[0]}
      surface="week"
      label={label}
      draggable={Boolean(main && !preview && !cancelled && editable(main))}
      aria-haspopup="dialog"
      aria-label={label}
      data-drop-preview={preview === "target" ? "" : undefined}
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-cell px-0.75 py-1.75 text-left transition-[color,background-color,opacity] duration-200 ease-out motion-reduce:transition-none min-[600px]:px-2",
        tone === "cours" &&
          "bg-cours-tint text-cours-foreground active:bg-cours-tint-strong",
        tone === "mine" && "bg-tint text-tint-foreground active:bg-tint-strong",
        tone === "other" &&
          "bg-muted text-foreground-muted active:bg-muted-hover",
        tone === "cancelled" &&
          "bg-muted text-foreground-muted active:bg-muted-hover",
        free && "border border-dashed border-border",
        conflict && "outline-1 outline-warning/60",
        preview === "target" && "outline-2 outline-offset-1 outline-primary",
        preview === "source" &&
          "opacity-40 outline-1 outline-border-strong outline-dashed",
      )}
    >
      {conflict && (
        <TriangleAlert
          size={10}
          strokeWidth={2}
          aria-hidden="true"
          className="absolute right-1 bottom-1 text-warning"
        />
      )}
      {status && !cancelled && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 size-1.5 rounded-full bg-current opacity-60"
        />
      )}
      {content}
    </DraggableButton>
  );
}
