import { describe, expect, test } from "bun:test";
import {
  abbreviate,
  compactLabel,
  daySlots,
  forGroup,
  groupsOfType,
  nextSessionAfter,
  resolveTpGroup,
  slotStatuses,
  sortSessions,
  mainTone,
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
  teacher: "LAICHI",
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
    expect(mainTone(lecture)).toBe("cours");
    expect(forGroup("G1")(lecture)).toBe(true);
    expect(forGroup("G4")(lecture)).toBe(true);
    expect(forGroup(null)(lecture)).toBe(true);
  });

  test("TD and TP are highlighted only for the selected group", () => {
    const td = sessions.find(({ groups }) => groups[0] === "G1")!;
    expect(mainTone(td)).toBe("mine");
    expect(forGroup("G1")(td)).toBe(true);
    expect(forGroup("G2")(td)).toBe(false);
    expect(forGroup(null)(td)).toBe(false);
  });

  test("TP follows the TP group, which can differ from the TD group", () => {
    const tp = sessions.find(({ type }) => type === "tp")!;
    const td = sessions.find(({ groups }) => groups[0] === "G1")!;
    expect(forGroup("G1")(tp)).toBe(false);
    expect(forGroup("G1", "G3")(tp)).toBe(true);
    expect(forGroup("G1", "G3")(td)).toBe(true);
    expect(forGroup("G3", "G1")(tp)).toBe(false);
  });
});

describe("TD and TP groups", () => {
  const section = {
    groups: ["G1", "G2", "G3"],
    sessions: [
      session({ groups: ["G1"] }),
      session({ groups: ["G2"] }),
      session({ type: "tp", groups: ["G1"] }),
      session({ type: "tp", groups: ["G3"] }),
    ],
  };

  test("lists the groups that have each kind of session", () => {
    expect(groupsOfType(section, "td")).toEqual(["G1", "G2"]);
    expect(groupsOfType(section, "tp")).toEqual(["G1", "G3"]);
  });

  test("uses the chosen TP group, else the TD group when it has TP", () => {
    const tpGroups = ["G1", "G3"];
    expect(resolveTpGroup(tpGroups, "G3", "G1")).toBe("G3");
    expect(resolveTpGroup(tpGroups, null, "G1")).toBe("G1");
    expect(resolveTpGroup(tpGroups, "G9", "G1")).toBe("G1");
    expect(resolveTpGroup(tpGroups, null, "G2")).toBeNull();
    expect(resolveTpGroup(["G1"], null, "G2")).toBe("G1");
    expect(resolveTpGroup([], "G1", "G1")).toBeNull();
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
