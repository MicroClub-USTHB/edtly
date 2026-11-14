import {
  sameState,
  slotOf,
  stateOf,
  type Override,
  type SessionState,
} from "@/lib/timetable/overrides";
import type { Session } from "@/lib/timetable/types";

export type Occurrence = {
  id: string;
  from: string;
  until: string | null;
  once: boolean;
  exclude: string[];
  state: SessionState;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

const fromUtc = (time: number) => new Date(time).toISOString().slice(0, 10);

export function weekOfIso(iso: string) {
  const time = toUtc(iso);
  const index = (new Date(time).getUTCDay() + 1) % 7;
  return fromUtc(time + (index === 6 ? 1 : -index) * DAY_MS);
}

export const shiftIso = (iso: string, days: number) =>
  fromUtc(toUtc(iso) + days * DAY_MS);

const byWeek = (a: Override, b: Override) => a.week.localeCompare(b.week);

export function occurrencesOf(
  session: Session,
  overrides: Override[],
  anchor: string,
  until: string | null,
): Occurrence[] {
  const start = weekOfIso(anchor);
  const inTerm = (week: string) => !until || week <= until;
  const pieces: Occurrence[] = [
    {
      id: "",
      from: start,
      until,
      once: false,
      exclude: [],
      state: stateOf(slotOf(session)),
    },
  ];

  for (const override of overrides
    .filter(({ scope }) => scope === "series")
    .sort(byWeek)) {
    if (!inTerm(override.week)) continue;
    const last = pieces[pieces.length - 1];
    if (override.week <= start) {
      last.state = override.state;
      continue;
    }
    if (sameState(override.state, last.state)) continue;
    last.until = shiftIso(override.week, -1);
    pieces.push({
      id: override.week,
      from: override.week,
      until,
      once: false,
      exclude: [],
      state: override.state,
    });
  }

  const series = [...pieces];
  for (const override of overrides
    .filter(({ scope }) => scope === "week")
    .sort(byWeek)) {
    if (override.week < start || !inTerm(override.week)) continue;
    const piece = [...series].reverse().find(({ from }) => from <= override.week);
    if (piece && sameState(override.state, piece.state)) continue;
    if (piece && !piece.state.cancelled) piece.exclude.push(override.week);
    if (!override.state.cancelled) {
      pieces.push({
        id: `once-${override.week}`,
        from: override.week,
        until,
        once: true,
        exclude: [],
        state: override.state,
      });
    }
  }

  return pieces.filter(({ state }) => !state.cancelled);
}
