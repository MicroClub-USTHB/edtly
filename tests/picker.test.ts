import { describe, expect, test } from "bun:test";
import {
  groupFromSlug,
  parcoursPath,
  parcoursUrl,
} from "@/lib/timetable/paths";
import {
  EMPTY_SELECTION,
  fillSingles,
  groupsOf,
  levelsOf,
  pick,
  resolve,
  tpGroupsOf,
} from "@/lib/timetable/picker";
import type { CatalogueProgramme } from "@/lib/timetable/types";

const catalogue: CatalogueProgramme[] = [
  {
    system: "lmd",
    level: "l2",
    speciality: { id: "isil", name: "ISIL" },
    status: "published",
    sections: [
      {
        id: "a",
        name: "A",
        groups: ["G1", "G2", "G3"],
        tdGroups: ["G1", "G2"],
        tpGroups: ["G1", "G2", "G3"],
      },
      {
        id: "b",
        name: "B",
        groups: ["G1", "G2"],
        tdGroups: ["G1", "G2"],
        tpGroups: [],
      },
    ],
  },
  {
    system: "lmd",
    level: "l2",
    speciality: { id: "acad", name: "ACAD" },
    status: "published",
    sections: [
      { id: "a", name: "A", groups: ["G1"], tdGroups: ["G1"], tpGroups: ["G1"] },
    ],
  },
  {
    system: "ing",
    level: "ing2",
    speciality: { id: "informatique", name: "Informatique" },
    status: "published",
    sections: [{ id: "d", name: "D", groups: [], tdGroups: [], tpGroups: [] }],
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
      tpGroup: null,
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
      tpGroup: null,
    });
    expect(pick(catalogue, full, "speciality", "acad")).toEqual({
      system: "lmd",
      level: "l2",
      speciality: "acad",
      section: "a",
      group: "G1",
      tpGroup: "G1",
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
    const parcours = resolve(catalogue, {
      ...partial,
      group: "G2",
      tpGroup: "G3",
    });
    expect(parcours && parcoursPath(parcours)).toBe("/lmd/l2/isil/a/g2");
  });

  test("offers TD groups and TP groups separately", () => {
    const selection = {
      ...EMPTY_SELECTION,
      system: "lmd" as const,
      level: "l2",
      speciality: "isil",
      section: "a",
    };
    expect(groupsOf(catalogue, selection)).toEqual(["G1", "G2"]);
    expect(tpGroupsOf(catalogue, selection)).toEqual(["G1", "G2", "G3"]);
  });

  test("requires a TP group when the section has several", () => {
    const withTd = pick(
      catalogue,
      {
        ...EMPTY_SELECTION,
        system: "lmd",
        level: "l2",
        speciality: "isil",
        section: "a",
      },
      "group",
      "G1",
    );
    expect(resolve(catalogue, withTd)).toBeNull();
    const withTp = pick(catalogue, withTd, "tpGroup", "G3");
    expect(resolve(catalogue, withTp)).toMatchObject({
      group: "G1",
      tpGroup: "G3",
    });
    expect(pick(catalogue, withTp, "group", "G2").tpGroup).toBeNull();
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
      tpGroup: null,
    });
  });
});

describe("parcours links", () => {
  const parcours = {
    system: "lmd" as const,
    level: "m2",
    speciality: "ssi",
    section: "a",
    group: "G1",
  };

  test("adds the TP group only when it differs from the TD group", () => {
    expect(parcoursUrl({ ...parcours, tpGroup: "G3" })).toBe(
      "/lmd/m2/ssi/a/g1?tp=g3",
    );
    expect(parcoursUrl({ ...parcours, tpGroup: "G1" })).toBe("/lmd/m2/ssi/a/g1");
    expect(parcoursUrl({ ...parcours, tpGroup: null })).toBe("/lmd/m2/ssi/a/g1");
    expect(parcoursPath({ ...parcours, tpGroup: "G3" })).toBe("/lmd/m2/ssi/a/g1");
  });

  test("reads a TP group back from its slug", () => {
    expect(groupFromSlug(["G1", "G2", "G3"], "g3")).toBe("G3");
    expect(groupFromSlug(["G1", "G2"], "g3")).toBeNull();
    expect(groupFromSlug(["G1"], null)).toBeNull();
  });
});
