import { useTranslations } from "next-intl";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import { isMoved } from "@/lib/timetable/overrides";
import type { Session, SessionSlot } from "@/lib/timetable/types";

export function useChangeLabels() {
  const t = useTranslations("Overrides");
  const long = useTranslations("Days.long");
  const short = useTranslations("Days.short");
  const labels = useSessionLabels();

  const slot = (value: SessionSlot, withRoom = false) =>
    [
      `${short(value.day)} ${value.start} – ${value.end}`,
      withRoom && value.room && labels.room(value.room),
    ]
      .filter(Boolean)
      .join(" · ");

  const target = (value: Pick<SessionSlot, "day" | "start">) =>
    `${long(value.day)} ${value.start}`;

  const compact = (value: Pick<SessionSlot, "day" | "start">) =>
    `${short(value.day)} · ${value.start}`;

  const status = (session: Session) => {
    const change = session.change;
    if (!change || change.preview || !change.scope) return null;
    const kind = change.cancelled
      ? "cancelled"
      : isMoved(session)
        ? "moved"
        : "edited";
    return t(`status.${kind}`, { scope: change.scope });
  };

  const usual = (session: Session) =>
    session.change && !session.change.preview
      ? t("usual", { slot: slot(session.change.original, true) })
      : null;

  return { slot, target, compact, status, usual };
}
