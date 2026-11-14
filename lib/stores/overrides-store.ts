import { useSyncExternalStore } from "react";
import {
  MAX_OVERRIDES,
  type Override,
  type SessionState,
} from "@/lib/timetable/overrides";
import { DAYS, type Day } from "@/lib/timetable/types";
import { OVERRIDES_KEY } from "./storage-keys";

type OverrideMap = Record<string, Override[]>;

const EMPTY: Override[] = [];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const WEEK = /^\d{4}-\d{2}-\d{2}$/;
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: OverrideMap = {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const isText = (value: unknown, pattern: RegExp): value is string =>
  typeof value === "string" && pattern.test(value);

function toState(value: unknown): SessionState | null {
  if (typeof value !== "object" || value === null) return null;
  const { day, start, end, room, cancelled } = value as Record<string, unknown>;
  if (
    !DAYS.includes(day as Day) ||
    !isText(start, TIME) ||
    !isText(end, TIME) ||
    start >= end ||
    typeof room !== "string"
  ) {
    return null;
  }
  return {
    day: day as Day,
    start,
    end,
    room: room.slice(0, 60),
    cancelled: cancelled === true,
  };
}

function toOverride(value: unknown): Override | null {
  if (typeof value !== "object" || value === null) return null;
  const { key, scope, week, state } = value as Record<string, unknown>;
  const parsed = toState(state);
  if (
    typeof key !== "string" ||
    key.length === 0 ||
    (scope !== "week" && scope !== "series") ||
    !isText(week, WEEK) ||
    !parsed
  ) {
    return null;
  }
  return { key, scope, week, state: parsed };
}

function readAll(): OverrideMap {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(OVERRIDES_KEY);
  } catch {}
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cached =
      typeof parsed === "object" && parsed !== null
        ? Object.fromEntries(
            Object.entries(parsed).flatMap(([path, list]) => {
              const overrides = Array.isArray(list)
                ? list
                    .map(toOverride)
                    .filter((override) => override !== null)
                    .slice(-MAX_OVERRIDES)
                : [];
              return overrides.length > 0 ? [[path, overrides]] : [];
            }),
          )
        : {};
  } catch {
    cached = {};
  }
  return cached;
}

export const readOverrides = (path: string) => readAll()[path] ?? EMPTY;

export function updateOverrides(
  path: string,
  update: (current: Override[]) => Override[],
) {
  const { [path]: current, ...rest } = readAll();
  const next = update(current ?? EMPTY);
  try {
    window.localStorage.setItem(
      OVERRIDES_KEY,
      JSON.stringify(next.length > 0 ? { ...rest, [path]: next } : rest),
    );
  } catch {}
  listeners.forEach((listener) => listener());
}

export const useOverrides = (path: string) =>
  useSyncExternalStore(
    subscribe,
    () => readOverrides(path),
    () => EMPTY,
  );
