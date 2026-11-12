import { capitalize } from "./dates";

const formatter = (locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, options);

export const formatDayTitle = (date: Date, locale: string) =>
  capitalize(
    formatter(locale, { weekday: "long", day: "numeric", month: "long" }).format(
      date,
    ),
  );

export function formatWeekRange(start: Date, end: Date, locale: string) {
  const long = formatter(locale, { day: "numeric", month: "long" });
  const sameMonth = start.getMonth() === end.getMonth();
  return {
    start: sameMonth ? String(start.getDate()) : long.format(start),
    end: long.format(end),
  };
}

export const formatShortDate = (date: Date, locale: string) =>
  formatter(locale, { day: "numeric", month: "short" }).format(date);

export const formatFullDate = (date: Date, locale: string) =>
  formatter(locale, { day: "numeric", month: "short", year: "numeric" }).format(
    date,
  );

export const parseIsoDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};
