import { useSyncExternalStore } from "react";
import { SEEN_KEY } from "./storage-keys";

type Seen = Record<string, { version: string; keys: string[] }>;

const EMPTY: ReadonlySet<string> = new Set();
const FLASH_MS = 2000;
const MAX_ENTRIES = 8;
const listeners = new Set<() => void>();
let flashing = EMPTY;

function set(next: ReadonlySet<string>) {
  flashing = next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

function readSeen(): Seen {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "{}") as Seen;
  } catch {
    return {};
  }
}

export function trackSessions(id: string, version: string, keys: string[]) {
  const { [id]: previous, ...others } = readSeen();
  const entries = Object.entries(others).slice(1 - MAX_ENTRIES);
  try {
    window.localStorage.setItem(
      SEEN_KEY,
      JSON.stringify(Object.fromEntries([...entries, [id, { version, keys }]])),
    );
  } catch {}

  if (!previous || previous.version === version) return;
  const known = new Set(previous.keys);
  const changed = keys.filter((key) => !known.has(key));
  if (changed.length === 0) return;

  set(new Set(changed));
  window.setTimeout(() => set(EMPTY), FLASH_MS);
}

export const useChangedSessions = () =>
  useSyncExternalStore(
    subscribe,
    () => flashing,
    () => EMPTY,
  );
