import type { ReactNode } from "react";
import type { SlotStatus, Tone } from "@/lib/timetable/schedule";
import { cn } from "@/lib/utils";
import { ConflictNote } from "./conflict-note";

type SessionCardProps = {
  title: string;
  meta: string;
  tone: Exclude<Tone, "other">;
  status?: SlotStatus;
  statusLabel?: string;
  conflict?: string;
  flash?: boolean;
  cancelled?: boolean;
  preview?: "source" | "target";
  note?: ReactNode;
};

export function SessionCard({
  title,
  meta,
  tone,
  status,
  statusLabel,
  conflict,
  flash = false,
  cancelled = false,
  preview,
  note,
}: SessionCardProps) {
  return (
    <span
      className={cn(
        "flex flex-col gap-0.75 self-stretch rounded-session px-4 py-3 transition-[color,background-color,opacity] duration-200 ease-out motion-reduce:transition-none",
        cancelled
          ? "bg-muted text-foreground-muted group-active:bg-muted-hover"
          : tone === "cours"
            ? "bg-cours-tint text-cours-foreground group-active:bg-cours-tint-strong"
            : "bg-tint text-tint-foreground group-active:bg-tint-strong",
        conflict && "outline-1 outline-warning/60",
        flash && "outline-2 outline-primary",
        preview === "target" && "outline-2 outline-offset-1 outline-primary",
        preview === "source" &&
          "opacity-40 outline-1 outline-offset-1 outline-border-strong outline-dashed",
      )}
    >
      <span className="flex items-start justify-between gap-2.5">
        <span
          className={cn(
            "text-label wrap-anywhere",
            cancelled && "line-through decoration-1",
          )}
        >
          {title}
        </span>

        {status && !cancelled && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs leading-5">
            {status === "now" && (
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-primary"
              />
            )}
            {statusLabel}
          </span>
        )}
      </span>

      <span className="text-meta">{meta}</span>

      {note}
      {conflict && <ConflictNote text={conflict} className="pt-0.5" />}
    </span>
  );
}
