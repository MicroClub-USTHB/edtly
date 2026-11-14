import { useSyncExternalStore } from "react";
import { CALENDAR_KEY } from "./storage-keys";

export type CalendarOpened = { token: string; at: string };

const MAX_ENTRIES = 8;
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Record<string, CalendarOpened> = {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const isOpened = (value: unknown): value is CalendarOpened => {
  const record = value as Record<string, unknown> | null;
  return (
    typeof record?.token === "string" &&
    typeof record.at === "string" &&
    !Number.isNaN(Date.parse(record.at))
  );
};

function readAll() {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CALENDAR_KEY);
  } catch {}
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cached =
      typeof parsed === "object" && parsed !== null
        ? Object.fromEntries(
            Object.entries(parsed).filter((entry): entry is [string, CalendarOpened] =>
              isOpened(entry[1]),
            ),
          )
        : {};
  } catch {
    cached = {};
  }
  return cached;
}

export function markCalendarOpened(path: string, token: string) {
  const entries = Object.entries(readAll())
    .filter(([key]) => key !== path)
    .slice(1 - MAX_ENTRIES);
  try {
    window.localStorage.setItem(
      CALENDAR_KEY,
      JSON.stringify(
        Object.fromEntries([
          ...entries,
          [path, { token, at: new Date().toISOString() }],
        ]),
      ),
    );
  } catch {}
  listeners.forEach((listener) => listener());
}

export const useCalendarOpened = (path: string) =>
  useSyncExternalStore(
    subscribe,
    () => readAll()[path] ?? null,
    () => null,
  );
