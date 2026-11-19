import { useSyncExternalStore } from "react";
import {
  EMPTY_PERSONAL,
  isCustomized,
  type Extra,
  type Personal,
} from "@/lib/timetable/personal";
import { PERSONAL_KEY } from "./storage-keys";

type PersonalMap = Record<string, Personal>;

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: PersonalMap = {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

function toExtra(value: unknown): Extra | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const { system, level, speciality, section, module, group } = record;
  if (![system, level, speciality, section, module].every(isString)) {
    return null;
  }
  return {
    system: system as string,
    level: level as string,
    speciality: speciality as string,
    section: section as string,
    module: module as string,
    group: isString(group) ? group : null,
  };
}

const toGroupMap = (value: unknown): Record<string, string> =>
  typeof value === "object" && value !== null
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => isString(entry[1]),
        ),
      )
    : {};

function toPersonal(value: unknown): Personal | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const hidden = Array.isArray(record.hidden)
    ? record.hidden.filter(isString)
    : [];
  const groups = toGroupMap(record.groups);
  const tpGroups =
    "tpGroups" in record ? toGroupMap(record.tpGroups) : groups;
  const extras = Array.isArray(record.extras)
    ? record.extras.map(toExtra).filter((extra) => extra !== null)
    : [];
  const personal = { hidden, groups, tpGroups, extras };
  return isCustomized(personal) ? personal : null;
}

function readAll(): PersonalMap {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PERSONAL_KEY);
  } catch {}
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cached =
      typeof parsed === "object" && parsed !== null
        ? Object.fromEntries(
            Object.entries(parsed)
              .map(([path, value]) => [path, toPersonal(value)] as const)
              .filter((entry): entry is [string, Personal] => entry[1] !== null),
          )
        : {};
  } catch {
    cached = {};
  }
  return cached;
}

function writeAll(map: PersonalMap) {
  try {
    window.localStorage.setItem(PERSONAL_KEY, JSON.stringify(map));
  } catch {}
  listeners.forEach((listener) => listener());
}

export function updatePersonal(
  path: string,
  update: (current: Personal) => Personal,
) {
  const { [path]: current, ...rest } = readAll();
  const next = update(current ?? EMPTY_PERSONAL);
  writeAll(isCustomized(next) ? { ...rest, [path]: next } : rest);
}

export function resetPersonal(path: string) {
  const previous = readAll()[path] ?? EMPTY_PERSONAL;
  updatePersonal(path, () => EMPTY_PERSONAL);
  return previous;
}

export const usePersonal = (path: string) =>
  useSyncExternalStore(
    subscribe,
    () => readAll()[path] ?? EMPTY_PERSONAL,
    () => EMPTY_PERSONAL,
  );
