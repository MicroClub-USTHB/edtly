import { useSyncExternalStore } from "react";
import { MODE_KEY } from "./storage-keys";

export type TimetableMode = "mine" | "full";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const read = (): TimetableMode =>
  document.documentElement.dataset.mode === "mine" ? "mine" : "full";

export function setMode(mode: TimetableMode) {
  document.documentElement.dataset.mode = mode;
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {}
  listeners.forEach((listener) => listener());
}

export const useMode = () =>
  useSyncExternalStore(subscribe, read, () => "full" as TimetableMode);
