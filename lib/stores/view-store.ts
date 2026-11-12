import { useSyncExternalStore } from "react";
import { todayIndex } from "@/lib/dates";

export type View = "day" | "week" | "settings";

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emit = () => listeners.forEach((listener) => listener());

const readView = (): View => {
  const view = document.documentElement.dataset.view;
  return view === "week" || view === "settings" ? view : "day";
};

const readDay = (): number => {
  const day = Number(document.documentElement.dataset.day);
  return Number.isInteger(day) && day >= 0 && day < 6
    ? day
    : (todayIndex(new Date()) ?? 0);
};

export function setView(view: View) {
  document.documentElement.dataset.view = view;
  emit();
}

export function setDay(day: number) {
  document.documentElement.dataset.day = String(day);
  emit();
}

export const useView = () =>
  useSyncExternalStore(subscribe, readView, () => "day" as View);

export const useSelectedDay = () =>
  useSyncExternalStore(subscribe, readDay, () => null);
