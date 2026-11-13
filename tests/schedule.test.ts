import { describe, expect, test } from "bun:test";
import {
  abbreviate,
  compactLabel,
  daySlots,
  forGroup,
  nextSessionAfter,
  slotStatuses,
  sortSessions,
  toneOf,
  weekRows,
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

const sessions = sortSessions([
  session({ groups: ["G2"], module: "ARCH1" }),
  session({}),
  session({ start: "09:40", end: "11:10", type: "cours", groups: [] }),
  session({ start: "11:20", end: "12:50", groups: ["G3"], type: "tp" }),
  session({ day: "wed", start: "13:00", end: "14:30", groups: ["G2"] }),
]);

describe("highlight rules", () => {
  test("a section lecture is always highlighted as cours", () => {
    const lecture = sessions.find(({ type }) => type === "cours")!;
    expect(toneOf(lecture, forGroup("G1"))).toBe("cours");
    expect(toneOf(lecture, forGroup("G4"))).toBe("cours");
    expect(toneOf(lecture, forGroup(null))).toBe("cours");
  });

  test("TD and TP are highlighted only for the selected group", () => {
    const td = sessions.find(({ groups }) => groups[0] === "G1")!;
    expect(toneOf(td, forGroup("G1"))).toBe("mine");
    expect(toneOf(td, forGroup("G2"))).toBe("other");
    expect(toneOf(td, forGroup(null))).toBe("other");
  });
});

describe("day slots", () => {
  test("keeps every session visible and splits mine from others", () => {
    const slots = daySlots(sessions, "mon", forGroup("G1"));
    expect(slots.map(({ start }) => start)).toEqual(["08:00", "09:40", "11:20"]);
    expect(slots[0].mains.map(({ module }) => module)).toEqual(["ALGO2"]);
    expect(slots[0].others.map(({ module }) => module)).toEqual(["ARCH1"]);
    expect(slots[2].mains).toEqual([]);
    expect(slots[2].others).toHaveLength(1);

    const total = slots.reduce(
      (count, slot) => count + slot.mains.length + slot.others.length,
      0,
    );
    expect(total).toBe(sessions.filter(({ day }) => day === "mon").length);
  });

  test("switching group only moves sessions between mains and others", () => {
    const [first] = daySlots(sessions, "mon", forGroup("G2"));
    expect(first.mains.map(({ module }) => module)).toEqual(["ARCH1"]);
    expect(first.others.map(({ module }) => module)).toEqual(["ALGO2"]);
  });

  test("marks the running and the upcoming session", () => {
    const slots = daySlots(sessions, "mon", forGroup("G1"));
    const statuses = slotStatuses(slots, 8 * 60 + 15);
    expect(statuses.get("08:00")).toBe("now");
    expect(statuses.get("09:40")).toBe("next");
    expect(statuses.has("11:20")).toBe(false);
    expect(slotStatuses(slots, 18 * 60).size).toBe(0);
  });
});

describe("week", () => {
  test("has one row per time slot and six day cells", () => {
    const rows = weekRows(sessions, forGroup("G2"));
    expect(rows.map(({ start }) => start)).toEqual([
      "08:00",
      "09:40",
      "11:20",
      "13:00",
    ]);
    expect(rows.every(({ cells }) => cells.length === 6)).toBe(true);
    expect(rows[3].cells[4].mains).toHaveLength(1);
  });

  test("finds the next class after an empty day, wrapping the week", () => {
    expect(nextSessionAfter(sessions, forGroup("G2"), 2)?.dayIndex).toBe(4);
    expect(nextSessionAfter(sessions, forGroup("G2"), 4)?.dayIndex).toBe(2);
    expect(nextSessionAfter([], forGroup("G1"), 0)).toBeNull();
  });
});

describe("labels", () => {
  test("keeps short codes and abbreviates long names", () => {
    expect(abbreviate("ALGO2")).toBe("ALGO2");
    expect(abbreviate("Theory of Information and Coding")).toBe("TIC");
    expect(compactLabel("LOGIQUE")).toBe("Logique");
    expect(compactLabel("POO")).toBe("POO");
    expect(compactLabel("PROB/STA")).toBe("Prob/​Sta");
  });
});
