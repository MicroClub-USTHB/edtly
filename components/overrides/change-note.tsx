"use client";

import { Ban, CalendarClock } from "lucide-react";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { isCancelled } from "@/lib/timetable/overrides";
import type { Session } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";

type ChangeNoteProps = {
  session: Session;
  detail?: boolean;
  className?: string;
};

export function ChangeNote({ session, detail = false, className }: ChangeNoteProps) {
  const labels = useChangeLabels();
  const status = labels.status(session);
  if (!status) return null;
  const Icon = isCancelled(session) ? Ban : CalendarClock;
  const usual = detail ? labels.usual(session) : null;

  return (
    <span className={cn("flex items-start gap-1.5 text-meta", className)}>
      <Icon
        size={12}
        strokeWidth={1.75}
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      />
      <span className="min-w-0 wrap-anywhere">
        {usual ? `${status} · ${usual}` : status}
      </span>
    </span>
  );
}
