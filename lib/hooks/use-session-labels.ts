import { useTranslations } from "next-intl";
import { abbreviate } from "@/lib/timetable/schedule";
import type { Session } from "@/lib/timetable/types";

export function useSessionLabels() {
  const t = useTranslations("Timetable");
  const types = useTranslations("SessionTypes");

  const room = (value: string) =>
    /^\d/.test(value) ? t("room", { room: value }) : value;

  const groups = (session: Session) =>
    session.groups.length > 0
      ? session.groups
          .map((group, index) => (index === 0 ? group : group.replace(/^G/, "")))
          .join("·")
      : "";

  const audience = (session: Session) => {
    const [first] = session.groups;
    const number = first?.match(/^G(\d+)$/)?.[1];
    return session.groups.length === 1 && number
      ? t("groupLabel", { name: number })
      : groups(session);
  };

  const conflict = (others: Session[] | undefined) => {
    if (!others || others.length === 0) return undefined;
    const [first] = others;
    const text = t("conflictWith", {
      module: first.module,
      start: first.start,
      end: first.end,
    });
    return others.length > 1 ? `${text} +${others.length - 1}` : text;
  };

  return {
    room,
    groups,
    audience,
    conflict,
    type: (session: Session) => types(session.type),
    meta: (session: Session, group: string | null = null) =>
      [
        types(session.type),
        !(group && session.groups.includes(group)) && groups(session),
        session.room && room(session.room),
        session.origin,
      ]
        .filter(Boolean)
        .join(" · "),
    short: (session: Session) =>
      [groups(session), types(session.type), abbreviate(session.module)]
        .filter(Boolean)
        .join(" "),
  };
}
