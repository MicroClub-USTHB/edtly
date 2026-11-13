import { DAYS, type Day } from "@/lib/timetable/types";

export const TIME_ZONE = "Africa/Algiers";

export type CalendarEvent = {
  uid: string;
  day: Day;
  start: string;
  end: string;
  summary: string;
  location: string;
  description: string;
  category: string;
  url: string;
};

export type CalendarMeta = {
  name: string;
  description: string;
  locale: string;
  anchor: string;
  updatedAt: string;
  until: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

function isoToUtc(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export const compactDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

const compactUtcDate = (time: number) =>
  new Date(time).toISOString().slice(0, 10).replace(/-/g, "");

export const compactTime = (time: string) => `${time.replace(":", "")}00`;

export const untilUtc = (iso: string) =>
  `${compactUtcDate(isoToUtc(iso))}T225959Z`;

export function firstOccurrence(anchor: string, day: Day) {
  const time = isoToUtc(anchor);
  const index = (new Date(time).getUTCDay() + 1) % 7;
  const saturday = time + (index === 6 ? 1 : -index) * DAY_MS;
  return compactUtcDate(saturday + DAYS.indexOf(day) * DAY_MS);
}

export const weeklyRule = (until: string | null) =>
  `RRULE:FREQ=WEEKLY${until ? `;UNTIL=${untilUtc(until)}` : ""}`;

const escapeText = (text: string) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

function fold(line: string) {
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const length = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (size + length > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += length;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function eventLines(event: CalendarEvent, meta: CalendarMeta, stamp: string) {
  const date = firstOccurrence(meta.anchor, event.day);
  if (meta.until && date > compactUtcDate(isoToUtc(meta.until))) return [];

  return [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `LAST-MODIFIED:${stamp}`,
    `DTSTART;TZID=${TIME_ZONE}:${date}T${compactTime(event.start)}`,
    `DTEND;TZID=${TIME_ZONE}:${date}T${compactTime(event.end)}`,
    weeklyRule(meta.until),
    `SUMMARY:${escapeText(event.summary)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    `DESCRIPTION:${escapeText(event.description)}`,
    `CATEGORIES:${escapeText(event.category)}`,
    `URL:${event.url}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ];
}

export function buildCalendar(meta: CalendarMeta, events: CalendarEvent[]) {
  const stamp = `${compactUtcDate(isoToUtc(meta.updatedAt))}T000000Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Edtly//Timetable//${meta.locale.toUpperCase()}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `NAME:${escapeText(meta.name)}`,
    `X-WR-CALNAME:${escapeText(meta.name)}`,
    `DESCRIPTION:${escapeText(meta.description)}`,
    `X-WR-CALDESC:${escapeText(meta.description)}`,
    `X-WR-TIMEZONE:${TIME_ZONE}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    "BEGIN:VTIMEZONE",
    `TZID:${TIME_ZONE}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events.flatMap((event) => eventLines(event, meta, stamp)),
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
