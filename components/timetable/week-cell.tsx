"use client";

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
  onOpen: (anchor: SheetAnchor) => void;
};

export function WeekCell({ cell, dayName, onOpen }: WeekCellProps) {
  const t = useTranslations("Timetable");
  const labels = useSessionLabels();
  const [main] = cell.mains;
  const extra = cell.mains.length + cell.others.length - (main ? 1 : 0);

  if (!main && extra === 0) return <span aria-hidden="true" />;

  const tone = main ? mainTone(main) : "other";

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={
        main
          ? `${dayName} ${cell.start}, ${main.module}, ${labels.type(main)}`
          : `${dayName} ${cell.start}, ${t("otherSessions", { count: extra })}`
      }
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-cell px-0.75 py-1.75 text-left transition-colors duration-200 ease-out motion-reduce:transition-none min-[600px]:px-2",
        tone === "cours" &&
          "bg-cours-tint text-cours-foreground active:bg-cours-tint-strong",
        tone === "mine" && "bg-tint text-tint-foreground active:bg-tint-strong",
        tone === "other" &&
          "bg-muted text-foreground-muted active:bg-muted-hover",
      )}
    >
      {main ? (
        <>
          <span className="line-clamp-2 text-tab wrap-anywhere min-[600px]:hidden">
            {compactLabel(main.module)}
          </span>
          <span className="line-clamp-2 hidden text-xs wrap-anywhere min-[600px]:block">
            {main.module}
          </span>
          <span className="truncate text-tab">
            {labels.type(main)}
          </span>
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
