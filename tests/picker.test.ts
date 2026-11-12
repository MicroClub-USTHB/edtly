import { describe, expect, test } from "bun:test";
import { parcoursPath } from "@/lib/timetable/paths";
import {
  EMPTY_SELECTION,
  fillSingles,
  levelsOf,
  pick,
  resolve,
} from "@/lib/timetable/picker";
import type { CatalogueProgramme } from "@/lib/timetable/types";

const catalogue: CatalogueProgramme[] = [
  {
    system: "lmd",
    level: "l2",
    speciality: { id: "isil", name: "ISIL" },
    status: "published",
    sections: [
      { id: "a", name: "A", groups: ["G1", "G2"] },
      { id: "b", name: "B", groups: ["G1", "G2"] },
    ],
  },
  {
    system: "lmd",
    level: "l2",
    speciality: { id: "acad", name: "ACAD" },
    status: "published",
    sections: [{ id: "a", name: "A", groups: ["G1"] }],
  },
  {
    system: "ing",
    level: "ing2",
    speciality: { id: "informatique", name: "Informatique" },
    status: "published",
    sections: [{ id: "d", name: "D", groups: [] }],
  },
  {
    system: "lmd",
    level: "m1",
    speciality: { id: "il", name: "IL" },
    status: "unsupported",
    sections: [],
  },
];

describe("parcours picker", () => {
  test("lists only levels that have data", () => {
    expect(levelsOf(catalogue, "lmd")).toEqual(["l2", "m1"]);
    expect(levelsOf(catalogue, "ing")).toEqual(["ing2"]);
  });

  test("skips steps that have a single choice", () => {
    const selection = pick(
      catalogue,
      pick(catalogue, EMPTY_SELECTION, "system", "ing"),
      "level",
      "ing2",
    );
    expect(selection).toEqual({
      system: "ing",
      level: "ing2",
      speciality: "informatique",
      section: "d",
      group: null,
    });
    expect(resolve(catalogue, selection)).not.toBeNull();
  });

  test("changing an earlier choice clears the later ones", () => {
    const full = fillSingles(catalogue, {
      system: "lmd",
      level: "l2",
      speciality: "isil",
      section: "b",
      group: "G2",
    });
    expect(pick(catalogue, full, "speciality", "acad")).toEqual({
      system: "lmd",
      level: "l2",
      speciality: "acad",
      section: "a",
      group: "G1",
    });
  });

  test("requires a group when the section has several", () => {
    const partial = {
      ...EMPTY_SELECTION,
      system: "lmd" as const,
      level: "l2",
      speciality: "isil",
      section: "a",
    };
    expect(resolve(catalogue, partial)).toBeNull();
    const parcours = resolve(catalogue, { ...partial, group: "G2" });
    expect(parcours && parcoursPath(parcours)).toBe("/lmd/l2/isil/a/g2");
  });

  test("routes unsupported programmes to their notice page", () => {
    const selection = pick(
      catalogue,
      pick(catalogue, EMPTY_SELECTION, "system", "lmd"),
      "level",
      "m1",
    );
    expect(resolve(catalogue, selection)).toEqual({
      system: "lmd",
      level: "m1",
      speciality: "il",
      section: "unique",
      group: null,
    });
  });
});
