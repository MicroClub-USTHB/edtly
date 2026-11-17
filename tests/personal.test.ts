import { describe, expect, test } from "bun:test";
import {
  EMPTY_PERSONAL,
  groupFor,
  isCustomized,
  matcherFor,
  mergeSessions,
  modulesOf,
  personalSessions,
  type RemoteSection,
} from "@/lib/timetable/personal";
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

const base = [
  session({ type: "cours", groups: [], start: "11:20", end: "12:50" }),
  session({ groups: ["G1"] }),
  session({ groups: ["G2"], room: "136" }),
  session({ module: "ARCH1", groups: ["G1"], day: "wed" }),
  session({ module: "ARCH1", groups: ["G2"], day: "wed", room: "446" }),
  session({ module: "POO", type: "cours", groups: [], day: "thu" }),
];

const retakeSource: RemoteSection = {
  label: "L1 Informatique · Section 3",
  url: "https://finfo.usthb.dz/storage/disk/l1.pdf",
  sessions: [
    session({ module: "ALGO", type: "cours", groups: [], day: "tue" }),
    session({ module: "ALGO", type: "tp", groups: ["G1"], day: "sat" }),
    session({ module: "ALGO", type: "tp", groups: ["G3"], day: "sun" }),
    session({ module: "MP", type: "cours", groups: [], day: "tue", start: "09:40", end: "11:10" }),
  ],
};
const remote = new Map([["/lmd/l1/informatique/3", retakeSource]]);
const extra = {
  system: "lmd",
  level: "l1",
  speciality: "informatique",
  section: "3",
  module: "ALGO",
  group: "G3",
};

describe("modules", () => {
  test("lists each module once with its types and groups", () => {
    expect(modulesOf(base)).toEqual([
      { name: "ALGO2", types: ["cours", "td"], groups: ["G1", "G2"] },
      { name: "ARCH1", types: ["td"], groups: ["G1", "G2"] },
      { name: "POO", types: ["cours"], groups: [] },
    ]);
  });

  test("ignores a module group that does not exist", () => {
    const [algo] = modulesOf(base);
    expect(groupFor(algo, { ...EMPTY_PERSONAL, groups: { ALGO2: "G9" } }, "G1")).toBe("G1");
    expect(groupFor(algo, { ...EMPTY_PERSONAL, groups: { ALGO2: "G2" } }, "G1")).toBe("G2");
  });
});

describe("my timetable", () => {
  test("takes TP from the TP group and TD from the TD group", () => {
    const withTp = [
      ...base,
      session({ type: "tp", groups: ["G1"], day: "sat" }),
      session({ type: "tp", groups: ["G2"], day: "sun" }),
    ];
    const mine = personalSessions(withTp, EMPTY_PERSONAL, "G1", remote, "G2");
    expect(
      mine
        .filter(({ type }) => type !== "cours")
        .map(({ module, type, groups }) => `${module}:${type}:${groups.join("")}`),
    ).toEqual(["ALGO2:tp:G2", "ALGO2:td:G1", "ARCH1:td:G1"]);
  });

  test("a module group applies to both its TD and its TP", () => {
    const withTp = [...base, session({ type: "tp", groups: ["G2"], day: "sun" })];
    const personal = { ...EMPTY_PERSONAL, groups: { ALGO2: "G2" } };
    const mine = personalSessions(withTp, personal, "G1", remote, "G1");
    expect(
      mine
        .filter(({ module, type }) => module === "ALGO2" && type !== "cours")
        .map(({ type, groups }) => `${type}:${groups.join("")}`),
    ).toEqual(["tp:G2", "td:G2"]);
  });

  test("defaults to the section lectures and the main group", () => {
    const mine = personalSessions(base, EMPTY_PERSONAL, "G1", remote);
    expect(mine.map(({ module, groups }) => `${module}:${groups.join("")}`)).toEqual([
      "ALGO2:G1",
      "ALGO2:",
      "ARCH1:G1",
      "POO:",
    ]);
  });

  test("hides passed modules, lecture included", () => {
    const mine = personalSessions(
      base,
      { ...EMPTY_PERSONAL, hidden: ["ALGO2"] },
      "G1",
      remote,
    );
    expect(mine.some(({ module }) => module === "ALGO2")).toBe(false);
    expect(mine).toHaveLength(2);
  });

  test("uses a different group for one module only", () => {
    const mine = personalSessions(
      base,
      { ...EMPTY_PERSONAL, groups: { ARCH1: "G2" } },
      "G1",
      remote,
    );
    expect(mine.find(({ module }) => module === "ARCH1")?.groups).toEqual(["G2"]);
    expect(mine.find(({ module, type }) => module === "ALGO2" && type === "td")?.groups).toEqual(["G1"]);
  });

  test("adds a retake module with its lecture and the chosen group only", () => {
    const mine = personalSessions(
      base,
      { ...EMPTY_PERSONAL, extras: [extra] },
      "G1",
      remote,
    );
    const retake = mine.filter(({ module }) => module === "ALGO");
    expect(retake.map(({ day, type }) => `${day}:${type}`)).toEqual([
      "sun:tp",
      "tue:cours",
    ]);
    expect(retake.every(({ origin }) => origin === retakeSource.label)).toBe(true);
    expect(retake.every(({ originUrl }) => originUrl === retakeSource.url)).toBe(true);
    expect(mine.some(({ module }) => module === "MP")).toBe(false);
  });

  test("waits for a retake section that is not loaded yet", () => {
    const mine = personalSessions(
      base,
      { ...EMPTY_PERSONAL, extras: [extra] },
      "G1",
      new Map(),
    );
    expect(mine.some(({ module }) => module === "ALGO")).toBe(false);
  });

  test("marks only my sessions and keeps the others for details", () => {
    const mine = personalSessions(base, EMPTY_PERSONAL, "G1", remote);
    const isMine = matcherFor(mine);
    const all = mergeSessions(mine, base);
    expect(all).toHaveLength(base.length);
    expect(all.filter(isMine)).toHaveLength(mine.length);
  });

  test("an empty personalisation is the default", () => {
    expect(isCustomized(EMPTY_PERSONAL)).toBe(false);
    expect(isCustomized({ ...EMPTY_PERSONAL, extras: [extra] })).toBe(true);
  });
});
