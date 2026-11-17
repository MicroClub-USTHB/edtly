import { minutesOf as toMinutes } from "@/lib/dates";
import {
  DAYS,
  type Day,
  type Section,
  type Session,
  type SessionType,
} from "./types";

export type Slot = { start: string; end: string };
export type SlotSessions = Slot & { mains: Session[]; others: Session[] };
export type Tone = "mine" | "cours" | "other";
export type Matcher = (session: Session) => boolean;

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

export const groupOfType = (
  session: Session,
  group: string | null,
  tpGroup: string | null,
) => (session.type === "tp" ? tpGroup : group);

export const forGroup =
  (group: string | null, tpGroup: string | null = group): Matcher =>
  (session) => {
    const own = groupOfType(session, group, tpGroup);
    return (
      session.groups.length === 0 || (own !== null && session.groups.includes(own))
    );
  };

export function groupsOfType(
  section: Pick<Section, "groups" | "sessions">,
  type: Exclude<SessionType, "cours">,
) {
  const used = new Set(
    section.sessions
      .filter((session) => session.type === type)
      .flatMap((session) => session.groups),
  );
  return section.groups.filter((group) => used.has(group));
}

export function resolveTpGroup(
  tpGroups: string[],
  chosen: string | null | undefined,
  group: string | null,
) {
  if (chosen && tpGroups.includes(chosen)) return chosen;
  if (group && tpGroups.includes(group)) return group;
  return tpGroups.length === 1 ? tpGroups[0] : null;
}

export const mainTone = (session: Session): Exclude<Tone, "other"> =>
  session.type === "cours" ? "cours" : "mine";

export const occupies = (session: Session) =>
  !session.change?.cancelled && session.change?.preview !== "source";

export const STANDARD_SLOTS: readonly Slot[] = [
  { start: "08:00", end: "09:30" },
  { start: "09:40", end: "11:10" },
  { start: "11:20", end: "12:50" },
  { start: "13:00", end: "14:30" },
  { start: "14:40", end: "16:10" },
  { start: "16:20", end: "17:50" },
];

export const slotOverlaps = (a: Slot, b: Slot) =>
  toMinutes(a.start) < toMinutes(b.end) &&
  toMinutes(b.start) < toMinutes(a.end);

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
  mine: Matcher,
): SlotSessions {
  const inSlot = sessions.filter(
    (session) =>
      session.day === day &&
      session.start === slot.start &&
      session.end === slot.end,
  );
  return {
    ...slot,
    mains: inSlot.filter((session) => mine(session)),
    others: inSlot.filter((session) => !mine(session)),
  };
}

export function daySlots(
  sessions: Session[],
  day: Day,
  mine: Matcher,
): SlotSessions[] {
  return slotsOf(sessions.filter((session) => session.day === day)).map(
    (slot) => slotSessions(sessions, day, slot, mine),
  );
}

const bySlot = (a: Slot, b: Slot) =>
  a.start.localeCompare(b.start) || a.end.localeCompare(b.end);

export function gridSlots(sessions: Session[], dragging = false): Slot[] {
  const data = slotsOf(sessions);
  if (data.length === 0) return dragging ? [...STANDARD_SLOTS] : data;
  const first = data[0].start;
  const last = data.reduce((max, { end }) => (end > max ? end : max), "00:00");
  const fill = STANDARD_SLOTS.filter(
    (slot) =>
      !data.some((taken) => slotOverlaps(taken, slot)) &&
      slot.start >= first &&
      (dragging || slot.end <= last),
  );
  return [...data, ...fill].sort(bySlot);
}

export function freeSlots(taken: Slot[], within?: Slot): Slot[] {
  return STANDARD_SLOTS.filter(
    (slot) =>
      !taken.some((busy) => slotOverlaps(busy, slot)) &&
      (!within || (slot.start >= within.start && slot.end <= within.end)),
  );
}

export type WeekRow = Slot & { cells: SlotSessions[] };

export function weekRows(
  sessions: Session[],
  mine: Matcher,
  slots: Slot[] = slotsOf(sessions),
): WeekRow[] {
  return slots.map((slot) => ({
    ...slot,
    cells: DAYS.map((day) => slotSessions(sessions, day, slot, mine)),
  }));
}

export type NextSession = { session: Session; dayIndex: number };

export function nextSessionAfter(
  sessions: Session[],
  mine: Matcher,
  fromDayIndex: number,
): NextSession | null {
  for (let offset = 1; offset <= DAYS.length; offset += 1) {
    const dayIndex = (fromDayIndex + offset) % DAYS.length;
    const session = sessions.find(
      (candidate) =>
        candidate.day === DAYS[dayIndex] && mine(candidate) && occupies(candidate),
    );
    if (session) return { session, dayIndex };
  }
  return null;
}

const STOP_WORDS = new Set([
  "de",
  "des",
  "du",
  "d",
  "la",
  "le",
  "les",
  "l",
  "et",
  "en",
  "à",
  "au",
  "aux",
  "pour",
  "of",
  "and",
  "the",
  "for",
  "to",
  "in",
  "sur",
  "un",
  "une",
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
  const busy = slots.filter((slot) => slot.mains.some(occupies));
  const current = busy.find(
    (slot) => toMinutes(slot.start) <= minutes && minutes < toMinutes(slot.end),
  );
  const upcoming = busy.find((slot) => toMinutes(slot.start) > minutes);
  if (current) statuses.set(current.start, "now");
  if (upcoming) statuses.set(upcoming.start, "next");
  return statuses;
}

const overlaps = (a: Session, b: Session) =>
  a.day === b.day && slotOverlaps(a, b);

export function overlapping(
  sessions: Session[],
  mine: Matcher,
  target: { day: Day } & Slot,
  except: (session: Session) => boolean,
) {
  return (
    sessions.find(
      (session) =>
        session.day === target.day &&
        mine(session) &&
        occupies(session) &&
        !except(session) &&
        slotOverlaps(session, target),
    ) ?? null
  );
}

export type Conflicts = ReadonlyMap<string, Session[]>;

export function conflictsOf(sessions: Session[], mine: Matcher): Conflicts {
  const conflicts = new Map<string, Session[]>();
  const add = (session: Session, other: Session) => {
    const key = sessionKey(session);
    conflicts.set(key, [...(conflicts.get(key) ?? []), other]);
  };
  for (const day of DAYS) {
    const list = sessions.filter(
      (session) => session.day === day && mine(session) && occupies(session),
    );
    list.forEach((a, index) => {
      for (const b of list.slice(index + 1)) {
        if (!overlaps(a, b)) continue;
        add(a, b);
        add(b, a);
      }
    });
  }
  return conflicts;
}

export const conflictPairs = (conflicts: Conflicts) =>
  [...conflicts.values()].reduce((total, list) => total + list.length, 0) / 2;

export type Gap = { start: string; end: string; minutes: number };

export function freeGaps(
  sessions: Session[],
  day: Day,
  mine: Matcher,
  minimum = 30,
): Gap[] {
  const busy = sessions
    .filter(
      (session) => session.day === day && mine(session) && occupies(session),
    )
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => a.start.localeCompare(b.start));

  const merged: Slot[] = [];
  for (const interval of busy) {
    const last = merged.at(-1);
    if (last && toMinutes(interval.start) <= toMinutes(last.end)) {
      if (interval.end > last.end) last.end = interval.end;
    } else {
      merged.push({ ...interval });
    }
  }

  return merged.slice(1).flatMap((interval, index) => {
    const start = merged[index].end;
    const minutes = toMinutes(interval.start) - toMinutes(start);
    return minutes >= minimum ? [{ start, end: interval.start, minutes }] : [];
  });
}

export type DayStatus =
  | {
      kind: "now";
      current: Session[];
      endsAt: string;
      progress: number;
      remaining: number;
      next: Session | null;
      nextIn: number;
    }
  | { kind: "free"; started: boolean; next: Session; nextIn: number }
  | { kind: "done"; next: NextSession | null };

export function dayStatus(
  sessions: Session[],
  dayIndex: number,
  mine: Matcher,
  minutes: number,
): DayStatus | null {
  const today = sessions.filter(
    (session) =>
      session.day === DAYS[dayIndex] && mine(session) && occupies(session),
  );
  if (today.length === 0) return null;

  const current = today.filter(
    (session) =>
      toMinutes(session.start) <= minutes && minutes < toMinutes(session.end),
  );
  const next = today.find((session) => toMinutes(session.start) > minutes);
  const nextIn = next ? toMinutes(next.start) - minutes : 0;

  if (current.length > 0) {
    const start = Math.min(
      ...current.map((session) => toMinutes(session.start)),
    );
    const end = Math.max(...current.map((session) => toMinutes(session.end)));
    return {
      kind: "now",
      current,
      endsAt: current.find((session) => toMinutes(session.end) === end)!.end,
      progress: (minutes - start) / (end - start),
      remaining: end - minutes,
      next: next ?? null,
      nextIn,
    };
  }

  if (next) {
    return {
      kind: "free",
      started: today.some((session) => toMinutes(session.end) <= minutes),
      next,
      nextIn,
    };
  }

  return { kind: "done", next: nextSessionAfter(sessions, mine, dayIndex) };
}

export const forGroups =
  (groups: string[]): Matcher =>
  (session) =>
    session.groups.length === 0 ||
    session.groups.some((group) => groups.includes(group));

export function daySpan(
  sessions: Session[],
  day: Day,
  mine: Matcher,
): Slot | null {
  const today = sessions.filter(
    (session) => session.day === day && mine(session) && occupies(session),
  );
  if (today.length === 0) return null;
  return {
    start: today.reduce(
      (min, { start }) => (start < min ? start : min),
      today[0].start,
    ),
    end: today.reduce((max, { end }) => (end > max ? end : max), today[0].end),
  };
}
