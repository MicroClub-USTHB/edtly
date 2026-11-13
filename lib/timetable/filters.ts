import { DAYS, type Day, type Session, type SessionType } from "./types";

export type Filters = {
  types: SessionType[];
  days: Day[];
  groups: string[];
  modules: string[];
};

export const NO_FILTERS: Filters = {
  types: [],
  days: [],
  groups: [],
  modules: [],
};

export const activeFilterCount = (filters: Filters) =>
  filters.types.length +
  filters.days.length +
  filters.groups.length +
  filters.modules.length;

export function matchesFilters(session: Session, filters: Filters) {
  const { types, days, groups, modules } = filters;
  return (
    (types.length === 0 || types.includes(session.type)) &&
    (days.length === 0 || days.includes(session.day)) &&
    (modules.length === 0 || modules.includes(session.module)) &&
    (groups.length === 0 ||
      session.groups.length === 0 ||
      session.groups.some((group) => groups.includes(group)))
  );
}

export const filterSessions = (sessions: Session[], filters: Filters) =>
  activeFilterCount(filters) === 0
    ? sessions
    : sessions.filter((session) => matchesFilters(session, filters));

export const visibleDays = (filters: Filters) =>
  DAYS.flatMap((day, index) =>
    filters.days.length === 0 || filters.days.includes(day) ? [index] : [],
  );

export const toggleValue = <T>(list: T[], value: T) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

export function pruneFilters(
  filters: Filters,
  modules: string[],
  groups: string[],
): Filters {
  return {
    ...filters,
    modules: filters.modules.filter((module) => modules.includes(module)),
    groups: filters.groups.filter((group) => groups.includes(group)),
  };
}
