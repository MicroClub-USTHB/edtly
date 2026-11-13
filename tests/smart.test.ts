import { describe, expect, test } from "bun:test";
import {
  activeFilterCount,
  filterSessions,
  NO_FILTERS,
  pruneFilters,
  toggleValue,
  visibleDays,
} from "@/lib/timetable/filters";
import {
  conflictPairs,
  conflictsOf,
  dayStatus,
  forGroup,
  forGroups,
  freeGaps,
  sessionKey,
} from "@/lib/timetable/schedule";
import type { Session } from "@/lib/timetable/types";

const session = (patch: Partial<Session>): Session => ({
  day: "mon",
  start: "08:00",
  end: "09:30",
  type: "td",
  module: "ALGO2",
  room: "134",
  groups: ["G1"],
  ...patch,
});

const at = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

const monday = [
  session({}),
  session({
    start: "09:40",
    end: "11:10",
    type: "cours",
    groups: [],
    module: "ANALYSE",
  }),
  session({ start: "14:40", end: "16:10", module: "ARCH1" }),
  session({
    start: "14:40",
    end: "16:10",
    module: "ARCH1",
    groups: ["G2"],
    room: "446",
  }),
  session({
    day: "wed",
    start: "08:00",
    end: "09:30",
    module: "LOGIQUE",
    type: "tp",
  }),
];

describe("conflicts", () => {
  test("finds sessions of mine that overlap in time", () => {
    const retake = session({
      start: "09:00",
      end: "10:30",
      module: "ALGO",
      groups: ["G3"],
      origin: "L1",
    });
    const all = [...monday, retake];
    const mine = (s: Session) => forGroup("G1")(s) || s === retake;
    const conflicts = conflictsOf(all, mine);
    expect(
      conflicts
        .get(sessionKey(retake))
        ?.map(({ module }) => module)
        .sort(),
    ).toEqual(["ALGO2", "ANALYSE"]);
    expect(
      conflicts.get(sessionKey(monday[0]))?.map(({ module }) => module),
    ).toEqual(["ALGO"]);
    expect(conflictPairs(conflicts)).toBe(2);
  });

  test("ignores back-to-back sessions and other groups", () => {
    expect(conflictsOf(monday, forGroup("G1")).size).toBe(0);
  });
});

describe("free periods", () => {
  test("lists gaps between my classes, not the 10 minute breaks", () => {
    expect(freeGaps(monday, "mon", forGroup("G1"))).toEqual([
      { start: "11:10", end: "14:40", minutes: 210 },
    ]);
  });

  test("merges overlapping classes before measuring gaps", () => {
    const sessions = [
      session({ start: "08:00", end: "10:00" }),
      session({ start: "09:00", end: "11:00", module: "X" }),
      session({ start: "13:00", end: "14:30", module: "Y" }),
    ];
    expect(freeGaps(sessions, "mon", () => true)).toEqual([
      { start: "11:00", end: "13:00", minutes: 120 },
    ]);
  });
});

describe("now and next", () => {
  const mine = forGroup("G1");

  test("during a class", () => {
    const status = dayStatus(monday, 2, mine, at("08:45"));
    expect(status?.kind).toBe("now");
    if (status?.kind !== "now") return;
    expect(status.current.map(({ module }) => module)).toEqual(["ALGO2"]);
    expect(status.endsAt).toBe("09:30");
    expect(status.remaining).toBe(45);
    expect(status.progress).toBe(0.5);
    expect(status.next?.module).toBe("ANALYSE");
    expect(status.nextIn).toBe(55);
  });

  test("before the first class and during a gap", () => {
    const early = dayStatus(monday, 2, mine, at("07:30"));
    expect(early).toMatchObject({ kind: "free", started: false, nextIn: 30 });
    const gap = dayStatus(monday, 2, mine, at("12:00"));
    expect(gap).toMatchObject({ kind: "free", started: true, nextIn: 160 });
    if (gap?.kind === "free") expect(gap.next.module).toBe("ARCH1");
  });

  test("after the last class points to the next day", () => {
    const done = dayStatus(monday, 2, mine, at("17:00"));
    expect(done?.kind).toBe("done");
    if (done?.kind === "done") {
      expect(done.next?.dayIndex).toBe(4);
      expect(done.next?.session.module).toBe("LOGIQUE");
    }
  });

  test("a day without classes has no status", () => {
    expect(dayStatus(monday, 3, mine, at("10:00"))).toBeNull();
  });
});

describe("filters", () => {
  test("no filters keeps everything", () => {
    expect(filterSessions(monday, NO_FILTERS)).toBe(monday);
    expect(visibleDays(NO_FILTERS)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test("combines type, day, module and group", () => {
    const filters = {
      ...NO_FILTERS,
      types: ["td" as const],
      days: ["mon" as const],
      groups: ["G2"],
    };
    expect(
      filterSessions(monday, filters).map(
        ({ module, groups }) => `${module}:${groups}`,
      ),
    ).toEqual(["ARCH1:G2"]);
    expect(activeFilterCount(filters)).toBe(3);
    expect(visibleDays(filters)).toEqual([2]);
  });

  test("group filter keeps the section lectures", () => {
    const filters = { ...NO_FILTERS, groups: ["G2"] };
    expect(filterSessions(monday, filters).map(({ module }) => module)).toEqual(
      ["ANALYSE", "ARCH1"],
    );
    expect(forGroups(["G2"])(monday[1])).toBe(true);
  });

  test("toggles values and drops filters that no longer exist", () => {
    expect(toggleValue(["td"], "tp")).toEqual(["td", "tp"]);
    expect(toggleValue(["td", "tp"], "td")).toEqual(["tp"]);
    expect(
      pruneFilters(
        { ...NO_FILTERS, modules: ["ALGO2", "OLD"], groups: ["G9"] },
        ["ALGO2"],
        ["G1"],
      ),
    ).toEqual({ ...NO_FILTERS, modules: ["ALGO2"] });
  });
});
