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

  return {
    room,
    groups,
    audience,
    type: (session: Session) => types(session.type),
    meta: (session: Session) =>
      [types(session.type), session.room && room(session.room)]
        .filter(Boolean)
        .join(" · "),
    short: (session: Session) =>
      [groups(session), types(session.type), abbreviate(session.module)]
        .filter(Boolean)
        .join(" "),
  };
}
