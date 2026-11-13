import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type CalendarNoteProps = {
  icon: LucideIcon;
  children: ReactNode;
};

export function CalendarNote({ icon: Icon, children }: CalendarNoteProps) {
  return (
    <li className="flex items-start gap-2.5 text-note text-foreground-secondary">
      <Icon
        size={16}
        strokeWidth={1.6}
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-foreground-muted"
      />
      <span>{children}</span>
    </li>
  );
}
