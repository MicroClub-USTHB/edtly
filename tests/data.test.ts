import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { programmeSchema } from "@/lib/timetable/schema";
import { sessionKey } from "@/lib/timetable/schedule";
import { LEVELS, SYSTEMS, type Programme } from "@/lib/timetable/types";

const DATA_DIR = path.join(import.meta.dir, "..", "data");

const files = SYSTEMS.flatMap((system) =>
  LEVELS[system].flatMap((level) =>
    readdirSync(path.join(DATA_DIR, system, level))
      .filter((file) => file.endsWith(".json"))
      .map((file) => ({ system, level, file })),
  ),
);

const load = (system: string, level: string, file: string) =>
  JSON.parse(
    readFileSync(path.join(DATA_DIR, system, level, file), "utf8"),
  ) as Programme;

describe("timetable data", () => {
  test("every level folder holds at least one programme", () => {
    for (const system of SYSTEMS) {
      for (const level of LEVELS[system]) {
        expect(
          files.some((entry) => entry.system === system && entry.level === level),
        ).toBe(true);
      }
    }
  });

  test.each(files)("$system/$level/$file is valid", ({ system, level, file }) => {
    const raw = load(system, level, file);
    const result = programmeSchema.safeParse(raw);
    expect(result.success ? [] : result.error.issues).toEqual([]);
    expect(raw.system).toBe(system);
    expect(raw.level).toBe(level);
    expect(`${raw.speciality.id}.json`).toBe(file);
    expect(raw.source.url).toStartWith("https://finfo.usthb.dz/");

    const sectionIds = raw.sections.map((section) => section.id);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);

    for (const section of raw.sections) {
      const keys = section.sessions.map(sessionKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  test("L2 ISIL section A matches the official document", () => {
    const programme = load("lmd", "l2", "isil.json");
    const section = programme.sections.find(({ id }) => id === "a");

    expect(programme.academicYear).toBe("2026/2027");
    expect(programme.source.updatedAt).toBe("2026-11-12");
    expect(section?.groups).toEqual(["G1", "G2", "G3", "G4"]);
    expect(section?.sessions).toHaveLength(32);
    expect(section?.sessions).toContainEqual({
      day: "mon",
      start: "08:00",
      end: "09:30",
      type: "td",
      module: "ALGO2",
      room: "BM3-7",
      teacher: "LAICHI",
      groups: ["G1"],
    });
    expect(section?.sessions).toContainEqual({
      day: "wed",
      start: "16:20",
      end: "17:50",
      type: "cours",
      module: "POO",
      room: "X",
      teacher: "ABDELLAHOUM",
      groups: [],
    });
    expect(
      section?.sessions.filter(({ day }) => ["sat", "sun", "tue"].includes(day)),
    ).toEqual([]);
  });
});
