import type { Session } from "@/lib/timetable/types";

type EventKey =
  | "SessionTypes.cours"
  | "SessionTypes.td"
  | "SessionTypes.tp"
  | "Timetable.room"
  | "Timetable.groupLabel"
  | "Timetable.sectionLabel"
  | "Session.wholeSection"
  | "Calendar.event.teacher"
  | "Calendar.event.retake"
  | "Calendar.event.page"
  | "Calendar.event.pdf";

export type EventTranslate = (
  key: EventKey,
  values?: Record<string, string>,
) => string;

export type EventContext = {
  sectionName: string;
  pageUrl: string;
  pdfUrl: string;
};

export type EventText = {
  summary: string;
  location: string;
  description: string;
  category: string;
};

function audienceOf(session: Session, t: EventTranslate, sectionName: string) {
  if (session.groups.length === 0) {
    return sectionName && !session.origin
      ? t("Timetable.sectionLabel", { name: sectionName })
      : t("Session.wholeSection");
  }
  const number =
    session.groups.length === 1
      ? session.groups[0].match(/^G(\d+)$/)?.[1]
      : null;
  return number
    ? t("Timetable.groupLabel", { name: number })
    : session.groups.join(", ");
}

export function eventText(
  session: Session,
  t: EventTranslate,
  { sectionName, pageUrl, pdfUrl }: EventContext,
): EventText {
  const type = t(`SessionTypes.${session.type}`);
  const room = /^\d/.test(session.room)
    ? t("Timetable.room", { room: session.room })
    : session.room;
  const remote = /distance/i.test(session.room);

  const lines = [`${type} · ${audienceOf(session, t, sectionName)}`];
  if (session.teacher) {
    lines.push(t("Calendar.event.teacher", { name: session.teacher }));
  }
  if (session.origin) {
    lines.push(t("Calendar.event.retake", { origin: session.origin }));
  }
  lines.push(
    "",
    t("Calendar.event.page", { url: pageUrl }),
    t("Calendar.event.pdf", { url: session.originUrl ?? pdfUrl }),
  );

  return {
    summary: `${session.module} · ${type}`,
    location: room && !remote ? `${room}, USTHB` : room,
    description: lines.join("\n"),
    category: type,
  };
}
