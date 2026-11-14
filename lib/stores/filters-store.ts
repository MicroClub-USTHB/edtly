import { useSyncExternalStore } from "react";
import {
  activeFilterCount,
  NO_FILTERS,
  type Filters,
} from "@/lib/timetable/filters";
import {
  DAYS,
  SESSION_TYPES,
  type Day,
  type SessionType,
} from "@/lib/timetable/types";
import { FILTERS_KEY } from "./storage-keys";

type FilterMap = Record<string, Filters>;

const MAX_ENTRIES = 8;
const MAX_VALUES = 60;
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: FilterMap = {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const texts = (value: unknown) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (item): item is string =>
              typeof item === "string" && item.length > 0 && item.length <= 120,
          ),
        ),
      ].slice(0, MAX_VALUES)
    : [];

function toFilters(value: unknown): Filters | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const filters: Filters = {
    types: texts(record.types).filter((type): type is SessionType =>
      SESSION_TYPES.includes(type as SessionType),
    ),
    days: texts(record.days).filter((day): day is Day =>
      DAYS.includes(day as Day),
    ),
    groups: texts(record.groups),
    modules: texts(record.modules),
  };
  return activeFilterCount(filters) > 0 ? filters : null;
}

function readAll(): FilterMap {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(FILTERS_KEY);
  } catch {}
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cached =
      typeof parsed === "object" && parsed !== null
        ? Object.fromEntries(
            Object.entries(parsed).flatMap(([path, value]) => {
              const filters = toFilters(value);
              return filters ? [[path, filters]] : [];
            }),
          )
        : {};
  } catch {
    cached = {};
  }
  return cached;
}

export function saveFilters(path: string, filters: Filters) {
  const others = Object.entries(readAll())
    .filter(([key]) => key !== path)
    .slice(1 - MAX_ENTRIES);
  const next = Object.fromEntries(
    activeFilterCount(filters) > 0 ? [...others, [path, filters]] : others,
  );
  try {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
}

export const useFilters = (path: string) =>
  useSyncExternalStore(
    subscribe,
    () => readAll()[path] ?? NO_FILTERS,
    () => NO_FILTERS,
  );
