import { findProgramme } from "./paths";
import {
  LEVELS,
  SYSTEMS,
  type CatalogueProgramme,
  type Parcours,
  type SystemId,
} from "./types";

export type Selection = {
  system: SystemId | null;
  level: string | null;
  speciality: string | null;
  section: string | null;
  group: string | null;
};

export type PickerField = keyof Selection;

export const EMPTY_SELECTION: Selection = {
  system: null,
  level: null,
  speciality: null,
  section: null,
  group: null,
};

const FIELDS: PickerField[] = [
  "system",
  "level",
  "speciality",
  "section",
  "group",
];

export const systemsOf = (catalogue: CatalogueProgramme[]) =>
  SYSTEMS.filter((system) =>
    catalogue.some((programme) => programme.system === system),
  );

export const levelsOf = (catalogue: CatalogueProgramme[], system: SystemId) =>
  LEVELS[system].filter((level) =>
    catalogue.some(
      (programme) => programme.system === system && programme.level === level,
    ),
  );

export const specialitiesOf = (
  catalogue: CatalogueProgramme[],
  system: SystemId,
  level: string,
) =>
  catalogue.filter(
    (programme) => programme.system === system && programme.level === level,
  );

function programmeOf(catalogue: CatalogueProgramme[], selection: Selection) {
  const { system, level, speciality } = selection;
  if (!system || !level || !speciality) return undefined;
  return findProgramme(catalogue, { system, level, speciality });
}

export const sectionsOf = (
  catalogue: CatalogueProgramme[],
  selection: Selection,
) => programmeOf(catalogue, selection)?.sections ?? [];

export const groupsOf = (
  catalogue: CatalogueProgramme[],
  selection: Selection,
) =>
  sectionsOf(catalogue, selection).find(
    (section) => section.id === selection.section,
  )?.groups ?? [];

export function fillSingles(
  catalogue: CatalogueProgramme[],
  selection: Selection,
): Selection {
  const next = { ...selection };
  if (next.system && next.level && !next.speciality) {
    const specialities = specialitiesOf(catalogue, next.system, next.level);
    if (specialities.length === 1) next.speciality = specialities[0].speciality.id;
  }
  if (next.speciality && !next.section) {
    const sections = sectionsOf(catalogue, next);
    if (sections.length === 1) next.section = sections[0].id;
  }
  if (next.section && !next.group) {
    const groups = groupsOf(catalogue, next);
    if (groups.length === 1) next.group = groups[0];
  }
  return next;
}

export function pick(
  catalogue: CatalogueProgramme[],
  selection: Selection,
  field: PickerField,
  value: string,
): Selection {
  const index = FIELDS.indexOf(field);
  const next = { ...selection, [field]: value } as Selection;
  for (const later of FIELDS.slice(index + 1)) next[later] = null;
  return fillSingles(catalogue, next);
}

export function resolve(
  catalogue: CatalogueProgramme[],
  selection: Selection,
): Parcours | null {
  const programme = programmeOf(catalogue, selection);
  const { system, level, speciality, section, group } = selection;
  if (!programme || !system || !level || !speciality) return null;
  if (programme.status === "unsupported") {
    return { system, level, speciality, section: "unique", group: null };
  }
  if (!section) return null;
  if (groupsOf(catalogue, selection).length > 0 && !group) return null;
  return { system, level, speciality, section, group };
}
