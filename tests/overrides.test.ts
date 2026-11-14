import { describe, expect, test } from "bun:test";
import { buildCalendar, type CalendarEvent } from "@/lib/calendar/ics";
import { occurrencesOf, shiftIso, weekOfIso } from "@/lib/calendar/occurrences";
import {
  decodeFeed,
  encodeFeed,
  feedOverrides,
  MAX_FEED_OVERRIDES,
} from "@/lib/calendar/token";
import {
  applyOverrides,
  hashKey,
  originKey,
  overrideAt,
  previewMove,
  slotOf,
  stateOf,
  withOverride,
  withoutOverride,
  type Override,
} from "@/lib/timetable/overrides";
import { EMPTY_PERSONAL } from "@/lib/timetable/personal";
import {
  conflictsOf,
  dayStatus,
  forGroup,
  freeGaps,
  gridSlots,
  freeSlots,
  sessionKey,
  STANDARD_SLOTS,
} from "@/lib/timetable/schedule";
import type { Session, SessionSlot } from "@/lib/timetable/types";

const session = (patch: Partial<Session> = {}): Session => ({
  day: "mon",
  start: "08:00",
  end: "09:30",
  type: "td",
  module: "ALGO2",
  room: "134",
  teacher: "LAICHI",
  groups: ["G1"],
  ...patch,
});

const algo = session();
const anum = session({ start: "09:40", end: "11:10", module: "ANUM", room: "210" });
const key = sessionKey(algo);
const week = "2026-11-14";
const nextWeek = "2026-11-21";
const later = "2026-12-05";
const tuesday: SessionSlot = { day: "tue", start: "09:40", end: "11:10", room: "134" };

const move = (
  scope: Override["scope"],
  at: string,
  slot = tuesday,
  cancelled = false,
): Override => ({ key, scope, week: at, state: stateOf(slot, cancelled) });

describe("resolving overrides", () => {
  test("a one-week move only applies to its week", () => {
    const overrides = withOverride([], move("week", week), slotOf(algo));
    const [moved] = applyOverrides([algo], overrides, week, null);
    expect(moved).toMatchObject({ day: "tue", start: "09:40", end: "11:10" });
    expect(moved.change).toMatchObject({ key, scope: "week", week });
    expect(applyOverrides([algo], overrides, nextWeek, null)).toEqual([algo]);
  });

  test("an every-week move applies from its week onward", () => {
    const overrides = withOverride([], move("series", nextWeek), slotOf(algo));
    expect(applyOverrides([algo], overrides, week, null)).toEqual([algo]);
    expect(applyOverrides([algo], overrides, later, null)[0].day).toBe("tue");
  });

  test("a one-week change wins over an every-week change", () => {
    const thursday: SessionSlot = { ...tuesday, day: "thu" };
    let overrides = withOverride([], move("series", week), slotOf(algo));
    overrides = withOverride(overrides, move("week", nextWeek, thursday), slotOf(algo));
    expect(applyOverrides([algo], overrides, nextWeek, null)[0].day).toBe("thu");
    expect(applyOverrides([algo], overrides, later, null)[0].day).toBe("tue");
  });

  test("a new every-week change replaces later changes", () => {
    const thursday: SessionSlot = { ...tuesday, day: "thu" };
    let overrides = withOverride([], move("week", later), slotOf(algo));
    overrides = withOverride(overrides, move("series", nextWeek, thursday), slotOf(algo));
    expect(overrides).toHaveLength(1);
    expect(applyOverrides([algo], overrides, later, null)[0].day).toBe("thu");
  });

  test("moving back to the official slot removes the override", () => {
    const overrides = withOverride([], move("week", week), slotOf(algo));
    const restored = withOverride(overrides, move("week", week, slotOf(algo)), slotOf(algo));
    expect(restored).toEqual([]);
  });

  test("restoring one week of an every-week change keeps an exception", () => {
    const overrides = withOverride([], move("series", week), slotOf(algo));
    const restored = withOverride(overrides, move("week", nextWeek, slotOf(algo)), slotOf(algo));
    expect(restored).toHaveLength(2);
    expect(applyOverrides([algo], restored, nextWeek, null)).toEqual([algo]);
    expect(applyOverrides([algo], restored, later, null)[0].day).toBe("tue");
  });

  test("restoring every week from a later week ends the series there", () => {
    const overrides = withOverride([], move("series", week), slotOf(algo));
    const restored = withOverride(overrides, move("series", nextWeek, slotOf(algo)), slotOf(algo));
    expect(applyOverrides([algo], restored, week, null)[0].day).toBe("tue");
    expect(applyOverrides([algo], restored, later, null)).toEqual([algo]);
  });

  test("overrides stop after the end of the semester", () => {
    const overrides = withOverride([], move("series", week), slotOf(algo));
    expect(applyOverrides([algo], overrides, "2027-02-06", "2027-01-31")).toEqual([algo]);
  });

  test("removing a single entry", () => {
    const overrides = withOverride([], move("week", week), slotOf(algo));
    expect(withoutOverride(overrides, overrides[0])).toEqual([]);
    expect(overrideAt(overrides, key, week)).toBe(overrides[0]);
  });

  test("resolved sessions keep their official identity", () => {
    const overrides = withOverride([], move("week", week), slotOf(algo));
    const [moved] = applyOverrides([algo], overrides, week, null);
    expect(originKey(moved)).toBe(key);
    expect(sessionKey(moved)).not.toBe(key);
  });
});

describe("recalculating the timetable", () => {
  const mine = forGroup("G1");

  test("a cancelled class frees its time", () => {
    const overrides = withOverride([], move("week", week, slotOf(algo), true), slotOf(algo));
    const sessions = applyOverrides([algo, anum], overrides, week, null);
    expect(sessions[0].change?.cancelled).toBe(true);
    expect(dayStatus(sessions, 2, mine, 8 * 60 + 30)).toMatchObject({
      kind: "free",
      next: anum,
    });
  });

  test("a move creates and clears overlaps", () => {
    const overlap = withOverride(
      [],
      move("week", week, { ...tuesday, day: "mon" }),
      slotOf(algo),
    );
    expect(conflictsOf(applyOverrides([algo, anum], overlap, week, null), mine).size).toBe(2);
    expect(conflictsOf([algo, anum], mine).size).toBe(0);
  });

  test("a move opens a free period", () => {
    const late = session({ start: "13:00", end: "14:30", module: "SYS" });
    const overrides = withOverride([], move("week", week), slotOf(algo));
    const sessions = applyOverrides([algo, anum, late], overrides, week, null);
    expect(freeGaps(sessions, "mon", mine)).toEqual([
      { start: "11:10", end: "13:00", minutes: 110 },
    ]);
  });

  test("a drag preview vacates the source and occupies the target", () => {
    const preview = previewMove([algo, anum], key, { ...tuesday, day: "mon" });
    expect(preview).toHaveLength(3);
    expect(preview.find((item) => item.change?.preview === "source")?.start).toBe("08:00");
    expect(conflictsOf(preview, mine).size).toBe(2);
  });
});

describe("grid slots", () => {
  test("fills holes between the first and last class", () => {
    const late = session({ start: "13:00", end: "14:30" });
    expect(gridSlots([algo, late]).map(({ start }) => start)).toEqual([
      "08:00",
      "09:40",
      "11:20",
      "13:00",
    ]);
  });

  test("adds later standard slots while dragging", () => {
    expect(gridSlots([algo], true)).toHaveLength(STANDARD_SLOTS.length);
    expect(gridSlots([], true)).toHaveLength(STANDARD_SLOTS.length);
    expect(gridSlots([])).toEqual([]);
  });

  test("never duplicates a slot that overlaps a class", () => {
    const odd = session({ start: "08:30", end: "10:00" });
    expect(gridSlots([odd], true).map(({ start }) => start)).not.toContain("08:00");
  });

  test("lists free standard slots inside a gap", () => {
    expect(
      freeSlots([algo], { start: "09:30", end: "13:00" }).map(({ start }) => start),
    ).toEqual(["09:40", "11:20"]);
  });
});

describe("calendar occurrences", () => {
  const anchor = "2026-11-05";

  test("an untouched class is one weekly event", () => {
    expect(occurrencesOf(algo, [], anchor, "2027-01-31")).toEqual([
      {
        id: "",
        from: weekOfIso(anchor),
        until: "2027-01-31",
        once: false,
        exclude: [],
        state: stateOf(slotOf(algo)),
      },
    ]);
  });

  test("a one-week move excludes the official date and adds a single event", () => {
    const pieces = occurrencesOf(algo, [move("week", week)], anchor, "2027-01-31");
    expect(pieces).toHaveLength(2);
    expect(pieces[0].exclude).toEqual([week]);
    expect(pieces[1]).toMatchObject({ once: true, from: week, state: { day: "tue" } });
  });

  test("an every-week move splits the series", () => {
    const pieces = occurrencesOf(algo, [move("series", week)], anchor, "2027-01-31");
    expect(pieces.map(({ from, until, state }) => [from, until, state.day])).toEqual([
      [weekOfIso(anchor), shiftIso(week, -1), "mon"],
      [week, "2027-01-31", "tue"],
    ]);
  });

  test("a cancelled week is only excluded", () => {
    const pieces = occurrencesOf(
      algo,
      [move("week", week, slotOf(algo), true)],
      anchor,
      "2027-01-31",
    );
    expect(pieces).toHaveLength(1);
    expect(pieces[0].exclude).toEqual([week]);
  });

  test("ICS output uses EXDATE and single events", () => {
    const pieces = occurrencesOf(algo, [move("week", week)], anchor, "2027-01-31");
    const events: CalendarEvent[] = pieces.map((piece) => ({
      uid: `${piece.id || "base"}@edtly`,
      day: piece.state.day,
      start: piece.state.start,
      end: piece.state.end,
      summary: "ALGO2 · TD",
      location: "",
      description: "",
      category: "TD",
      url: "https://edtly.app",
      from: piece.from,
      until: piece.until,
      once: piece.once,
      exclude: piece.exclude,
    }));
    const body = buildCalendar(
      {
        name: "Edtly",
        description: "",
        locale: "fr",
        anchor,
        updatedAt: anchor,
        until: "2027-01-31",
      },
      events,
    );
    expect(body).toContain("EXDATE;TZID=Africa/Algiers:20261116T080000");
    expect(body).toContain("DTSTART;TZID=Africa/Algiers:20261117T094000");
    expect(body.match(/RRULE:/g)).toHaveLength(1);
  });
});

describe("feed token overrides", () => {
  const base = {
    locale: "fr" as const,
    section: { system: "lmd", level: "l2", speciality: "isil", section: "a" },
    group: "G1",
    personal: EMPTY_PERSONAL,
  };

  test("round-trips moves and cancellations", () => {
    const overrides = feedOverrides(
      [move("week", week), move("series", later, slotOf(algo), true)],
      new Set([key]),
    );
    const decoded = decodeFeed(encodeFeed({ ...base, overrides }));
    expect(decoded?.overrides).toHaveLength(2);
    expect(decoded?.overrides).toContainEqual({
      ref: hashKey(key),
      scope: "week",
      week,
      state: stateOf(tuesday),
    });
    expect(decoded?.overrides).toContainEqual({
      ref: hashKey(key),
      scope: "series",
      week: later,
      state: null,
    });
  });

  test("skips overrides for classes outside the timetable and caps the list", () => {
    expect(feedOverrides([move("week", week)], new Set())).toEqual([]);
    const many = Array.from({ length: MAX_FEED_OVERRIDES + 10 }, (_, index) =>
      move("week", shiftIso(week, index * 7)),
    );
    const capped = feedOverrides(many, new Set([key]));
    expect(capped).toHaveLength(MAX_FEED_OVERRIDES);
    expect(decodeFeed(encodeFeed({ ...base, overrides: capped }))?.overrides).toHaveLength(
      MAX_FEED_OVERRIDES,
    );
  });

  test("tokens without overrides are unchanged", () => {
    expect(decodeFeed(encodeFeed(base))).toEqual(base);
  });
});
