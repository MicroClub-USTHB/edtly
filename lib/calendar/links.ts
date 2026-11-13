import { site } from "@/lib/site";
import type { EventText } from "./event";
import { compactDate, compactTime, TIME_ZONE, weeklyRule } from "./ics";

const GOOGLE_CALENDAR = "https://calendar.google.com/calendar";

export const feedUrl = (token: string) =>
  `${site.url}/api/calendar/${token}.ics`;

export const webcalUrl = (url: string) =>
  url.replace(/^https?:\/\//, "webcal://");

export const googleSubscribeUrl = (url: string) =>
  `${GOOGLE_CALENDAR}/r?cid=${encodeURIComponent(webcalUrl(url))}`;

type EventTiming = {
  date: Date;
  start: string;
  end: string;
  until: string | null;
};

export function googleEventUrl(
  text: EventText,
  { date, start, end, until }: EventTiming,
) {
  const day = compactDate(date);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: text.summary,
    dates: `${day}T${compactTime(start)}/${day}T${compactTime(end)}`,
    ctz: TIME_ZONE,
    details: text.description,
    location: text.location,
  });
  if (until && day <= until.replace(/-/g, "")) {
    params.set("recur", weeklyRule(until));
  }
  return `${GOOGLE_CALENDAR}/render?${params}`;
}
