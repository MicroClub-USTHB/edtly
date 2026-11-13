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
};

export function SessionCard({
  title,
  meta,
  tone,
  status,
  statusLabel,
  conflict,
  flash = false,
}: SessionCardProps) {
  return (
    <span
      className={cn(
        "flex flex-col gap-0.75 self-stretch rounded-session px-4 py-3 transition-colors duration-200 ease-out motion-reduce:transition-none",
        tone === "cours"
          ? "bg-cours-tint text-cours-foreground group-active:bg-cours-tint-strong"
          : "bg-tint text-tint-foreground group-active:bg-tint-strong",
        conflict && "outline-1 outline-warning/60",
        flash && "outline-2 outline-primary",
      )}
    >
      <span className="flex items-start justify-between gap-2.5">
        <span className="text-label wrap-anywhere">{title}</span>

        {status && (
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

      {conflict && <ConflictNote text={conflict} className="pt-0.5" />}
    </span>
  );
}
