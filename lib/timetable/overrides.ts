import { minutesOf, timeOf } from "@/lib/dates";
import { sessionKey, sortSessions } from "./schedule";
import type {
  OverrideScope,
  Session,
  SessionChange,
  SessionSlot,
} from "./types";

export type SessionState = SessionSlot & { cancelled: boolean };

export type Override = {
  key: string;
  scope: OverrideScope;
  week: string;
  state: SessionState;
};

export const MAX_OVERRIDES = 200;

export const slotOf = ({ day, start, end, room }: Session): SessionSlot => ({
  day,
  start,
  end,
  room,
});

export const stateOf = (
  slot: SessionSlot,
  cancelled = false,
): SessionState => ({
  day: slot.day,
  start: slot.start,
  end: slot.end,
  room: slot.room,
  cancelled,
});

export const sameSlot = (a: SessionSlot, b: SessionSlot) =>
  a.day === b.day && a.start === b.start && a.end === b.end && a.room === b.room;

export const sameState = (a: SessionState, b: SessionState) =>
  a.cancelled === b.cancelled && (a.cancelled || sameSlot(a, b));

export const originKey = (session: Session) =>
  session.change?.key ?? sessionKey(session);

export const originalOf = (session: Session) =>
  session.change?.original ?? slotOf(session);

export const isCancelled = (session: Session) =>
  session.change?.cancelled === true;

export const isMoved = (session: Session) => {
  const original = session.change?.original;
  return Boolean(
    original &&
      !session.change?.cancelled &&
      (original.day !== session.day || original.start !== session.start),
  );
};

export const durationOf = (slot: Pick<SessionSlot, "start" | "end">) =>
  minutesOf(slot.end) - minutesOf(slot.start);

export const withDuration = (start: string, minutes: number) =>
  timeOf(minutesOf(start) + minutes);

const sameTarget = (a: Override, b: Pick<Override, "key" | "scope" | "week">) =>
  a.key === b.key && a.scope === b.scope && a.week === b.week;

function seriesAt(overrides: Override[], key: string, week: string) {
  let found: Override | undefined;
  for (const override of overrides) {
    if (
      override.key === key &&
      override.scope === "series" &&
      override.week <= week &&
      (!found || override.week > found.week)
    ) {
      found = override;
    }
  }
  return found;
}

export function overrideAt(overrides: Override[], key: string, week: string) {
  return (
    overrides.find(
      (override) =>
        override.key === key &&
        override.scope === "week" &&
        override.week === week,
    ) ?? seriesAt(overrides, key, week)
  );
}

export function resolveSession(
  session: Session,
  overrides: Override[],
  week: string,
): Session {
  const key = sessionKey(session);
  const override = overrideAt(overrides, key, week);
  const original = slotOf(session);
  if (!override || sameState(override.state, stateOf(original))) {
    return session;
  }

  const { state } = override;
  const change: SessionChange = {
    key,
    original,
    scope: override.scope,
    week: override.week,
    cancelled: state.cancelled,
  };
  return {
    ...session,
    day: state.day,
    start: state.start,
    end: state.end,
    room: state.room,
    change,
  };
}

export function applyOverrides(
  sessions: Session[],
  overrides: Override[],
  week: string | null,
  until: string | null,
) {
  if (!week || overrides.length === 0 || (until && week > until)) {
    return sessions;
  }
  return sortSessions(
    sessions.map((session) => resolveSession(session, overrides, week)),
  );
}

export function withOverride(
  overrides: Override[],
  next: Override,
  original: SessionSlot,
): Override[] {
  const kept = overrides.filter((override) =>
    override.key !== next.key
      ? true
      : next.scope === "week"
        ? !sameTarget(override, next)
        : override.week < next.week,
  );
  const baseline = seriesAt(kept, next.key, next.week)?.state ?? stateOf(original);
  const result = sameState(next.state, baseline) ? kept : [...kept, next];
  return result.slice(-MAX_OVERRIDES);
}

export const withoutOverride = (overrides: Override[], target: Override) =>
  overrides.filter((override) => !sameTarget(override, target));

export function previewMove(
  sessions: Session[],
  key: string,
  target: SessionSlot,
): Session[] {
  return sortSessions(
    sessions.flatMap((session) => {
      if (originKey(session) !== key) return [session];
      const original = originalOf(session);
      const base: SessionChange = session.change ?? {
        key,
        original,
        scope: null,
        week: null,
        cancelled: false,
      };
      return [
        { ...session, change: { ...base, preview: "source" } },
        {
          ...session,
          ...target,
          change: {
            key,
            original,
            scope: null,
            week: null,
            cancelled: false,
            preview: "target",
          },
        },
      ];
    }),
  );
}

export function hashKey(key: string) {
  let hash = 0x811c9dc5;
  for (const char of key) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
