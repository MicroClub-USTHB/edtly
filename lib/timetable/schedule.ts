import { DAYS, type Day, type Session, type SessionType } from "./types";

export type Slot = { start: string; end: string };
export type SlotSessions = Slot & { mains: Session[]; others: Session[] };
export type Tone = "mine" | "cours" | "other";

const TYPE_ORDER: Record<SessionType, number> = { cours: 0, td: 1, tp: 2 };

const groupNumber = (group: string | undefined) => {
  const digits = group?.match(/\d+/);
  return digits ? Number(digits[0]) : Number.MAX_SAFE_INTEGER;
};

export function sortSessions(sessions: Session[]) {
  return [...sessions].sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
      a.start.localeCompare(b.start) ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      groupNumber(a.groups[0]) - groupNumber(b.groups[0]) ||
      a.module.localeCompare(b.module),
  );
}

export const appliesTo = (session: Session, group: string | null) =>
  session.groups.length === 0 ||
  (group !== null && session.groups.includes(group));

export function toneOf(session: Session, group: string | null): Tone {
  if (!appliesTo(session, group)) return "other";
  return session.type === "cours" ? "cours" : "mine";
}

export function slotsOf(sessions: Session[]): Slot[] {
  const slots = new Map<string, Slot>();
  for (const { start, end } of sessions) {
    slots.set(`${start}-${end}`, { start, end });
  }
  return [...slots.values()].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  );
}

export function slotSessions(
  sessions: Session[],
  day: Day,
  slot: Slot,
  group: string | null,
): SlotSessions {
  const inSlot = sessions.filter(
    (session) =>
      session.day === day &&
      session.start === slot.start &&
      session.end === slot.end,
  );
  return {
    ...slot,
    mains: inSlot.filter((session) => appliesTo(session, group)),
    others: inSlot.filter((session) => !appliesTo(session, group)),
  };
}

export function daySlots(
  sessions: Session[],
  day: Day,
  group: string | null,
): SlotSessions[] {
  return slotsOf(sessions.filter((session) => session.day === day)).map(
    (slot) => slotSessions(sessions, day, slot, group),
  );
}

export type WeekRow = Slot & { cells: SlotSessions[] };

export function weekRows(sessions: Session[], group: string | null): WeekRow[] {
  return slotsOf(sessions).map((slot) => ({
    ...slot,
    cells: DAYS.map((day) => slotSessions(sessions, day, slot, group)),
  }));
}

export type NextSession = { session: Session; dayIndex: number };

export function nextSessionAfter(
  sessions: Session[],
  group: string | null,
  fromDayIndex: number,
): NextSession | null {
  for (let offset = 1; offset <= DAYS.length; offset += 1) {
    const dayIndex = (fromDayIndex + offset) % DAYS.length;
    const session = sessions.find(
      (candidate) =>
        candidate.day === DAYS[dayIndex] && appliesTo(candidate, group),
    );
    if (session) return { session, dayIndex };
  }
  return null;
}

const STOP_WORDS = new Set([
  "de", "des", "du", "d", "la", "le", "les", "l", "et", "en", "à", "au",
  "aux", "pour", "of", "and", "the", "for", "to", "in", "sur", "un", "une",
]);

export function abbreviate(module: string) {
  if (module.length <= 9) return module;
  const words = module
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()));
  if (words.length < 2) return module;
  return words
    .slice(0, 5)
    .map((word) => (/^\d+$/.test(word) ? word : word[0].toUpperCase()))
    .join("");
}

export function compactLabel(module: string) {
  const short = abbreviate(module);
  const cased =
    short.length <= 4 || /\p{Ll}/u.test(short)
      ? short
      : short.replace(
          /\p{L}+/gu,
          (word) => word[0] + word.slice(1).toLowerCase(),
        );
  return cased.replace(/([/.])(?=\p{L})/gu, "$1\u200b");
}

export const sessionKey = (session: Session) =>
  [
    session.day,
    session.start,
    session.type,
    session.module,
    session.room,
    session.groups.join("+"),
  ].join("|");

export type SlotStatus = "now" | "next";

export function slotStatuses(slots: SlotSessions[], minutes: number) {
  const statuses = new Map<string, SlotStatus>();
  const toMinutes = (time: string) =>
    Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const busy = slots.filter((slot) => slot.mains.length > 0);
  const current = busy.find(
    (slot) => toMinutes(slot.start) <= minutes && minutes < toMinutes(slot.end),
  );
  const upcoming = busy.find((slot) => toMinutes(slot.start) > minutes);
  if (current) statuses.set(current.start, "now");
  if (upcoming) statuses.set(upcoming.start, "next");
  return statuses;
}
