import { useSyncExternalStore } from "react";
import { parcoursPath } from "@/lib/timetable/paths";
import type { Parcours } from "@/lib/timetable/types";
import { PARCOURS_KEY, START_VIEW_KEY } from "./storage-keys";

export type SavedParcours = Parcours & { path: string };
export type StartView = "day" | "week";

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedParcours: SavedParcours | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const emit = () => listeners.forEach((listener) => listener());

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
  emit();
}

function isSavedParcours(value: unknown): value is SavedParcours {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    ["system", "level", "speciality", "section", "path"].every(
      (key) => typeof record[key] === "string",
    ) &&
    (record.group === null || typeof record.group === "string") &&
    (record.tpGroup === undefined ||
      record.tpGroup === null ||
      typeof record.tpGroup === "string")
  );
}

export function readParcours(): SavedParcours | null {
  const raw = read(PARCOURS_KEY);
  if (raw === cachedRaw) return cachedParcours;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cachedParcours = isSavedParcours(parsed) ? parsed : null;
  } catch {
    cachedParcours = null;
  }
  return cachedParcours;
}

export function saveParcours(parcours: Parcours) {
  const saved: SavedParcours = { ...parcours, path: parcoursPath(parcours) };
  write(PARCOURS_KEY, JSON.stringify(saved));
}

const readStartView = (): StartView =>
  read(START_VIEW_KEY) === "week" ? "week" : "day";

export const setStartView = (view: StartView) => write(START_VIEW_KEY, view);

export const useSavedParcours = () =>
  useSyncExternalStore(subscribe, readParcours, () => null);

export const useStartView = () =>
  useSyncExternalStore(subscribe, readStartView, () => null);
