import type { CatalogueProgramme, Parcours } from "./types";

export const groupSlug = (group: string) => group.toLowerCase();

export type SectionRef = {
  system: string;
  level: string;
  speciality: string;
  section: string;
};

export function sectionPath(parcours: SectionRef) {
  return `/${parcours.system}/${parcours.level}/${parcours.speciality}/${parcours.section}`;
}

export function parcoursPath(parcours: Parcours) {
  const base = sectionPath(parcours);
  return parcours.group ? `${base}/${groupSlug(parcours.group)}` : base;
}

export const TP_PARAM = "tp";

export function parcoursUrl(parcours: Parcours) {
  const path = parcoursPath(parcours);
  const { group, tpGroup } = parcours;
  return group && tpGroup && tpGroup !== group
    ? `${path}?${TP_PARAM}=${groupSlug(tpGroup)}`
    : path;
}

export const groupFromSlug = (groups: string[], slug: string | null) =>
  slug ? (groups.find((group) => groupSlug(group) === slug) ?? null) : null;

export const localized = (locale: string, path: string) =>
  `/${locale}${path === "/" ? "" : path}`;

export function levelLabel(level: string) {
  return level.startsWith("ing")
    ? `Ing${level.slice(3)}`
    : level.toUpperCase();
}

export function findProgramme(
  catalogue: CatalogueProgramme[],
  parcours: Pick<Parcours, "system" | "level" | "speciality">,
) {
  return catalogue.find(
    (programme) =>
      programme.system === parcours.system &&
      programme.level === parcours.level &&
      programme.speciality.id === parcours.speciality,
  );
}
