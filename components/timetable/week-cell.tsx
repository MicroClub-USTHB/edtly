"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SheetAnchor } from "@/components/ui/sheet";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import {
  compactLabel,
  mainTone,
  type SlotSessions,
} from "@/lib/timetable/schedule";
import { cn } from "@/lib/utils";

type WeekCellProps = {
  cell: SlotSessions;
  dayName: string;
  conflict: boolean;
  free: boolean;
  onOpen: (anchor: SheetAnchor) => void;
};

export function WeekCell({
  cell,
  dayName,
  conflict,
  free,
  onOpen,
}: WeekCellProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();
  const [main] = cell.mains;
  const extra = cell.mains.length + cell.others.length - (main ? 1 : 0);

  if (!main && extra === 0) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          free && "rounded-cell border border-dashed border-border",
        )}
      />
    );
  }

  const tone = main ? mainTone(main) : "other";

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={
        main
          ? `${dayName} ${cell.start}, ${main.module}, ${labels.type(main)}${conflict ? `, ${t("conflictShort")}` : ""}`
          : `${dayName} ${cell.start}, ${t("otherSessions", { count: extra })}`
      }
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-cell px-0.75 py-1.75 text-left transition-colors duration-200 ease-out motion-reduce:transition-none min-[600px]:px-2",
        tone === "cours" &&
          "bg-cours-tint text-cours-foreground active:bg-cours-tint-strong",
        tone === "mine" && "bg-tint text-tint-foreground active:bg-tint-strong",
        tone === "other" &&
          "bg-muted text-foreground-muted active:bg-muted-hover",
        free && "border border-dashed border-border",
        conflict && "outline-1 outline-warning/60",
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
      {main ? (
        <>
          <span className="line-clamp-2 text-tab wrap-anywhere min-[600px]:hidden">
            {compactLabel(main.module)}
          </span>
          <span className="line-clamp-2 hidden text-xs wrap-anywhere min-[600px]:block">
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
      )}
    </button>
  );
}
