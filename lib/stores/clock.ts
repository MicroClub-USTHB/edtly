import { useSyncExternalStore } from "react";
import { todayIndex } from "@/lib/dates";
import { setDay } from "./view-store";

const TICK_MS = 30_000;
const listeners = new Set<() => void>();
let now: Date | null = null;
let timer: number | undefined;

function tick() {
  const previous = now;
  now = new Date();
  if (previous && previous.getDate() !== now.getDate()) {
    const index = todayIndex(now);
    const root = document.documentElement;
    if (index === null) delete root.dataset.today;
    else root.dataset.today = String(index);
    setDay(index ?? 0);
  }
  listeners.forEach((listener) => listener());
}

const onVisible = () => {
  if (document.visibilityState === "visible") tick();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.documentElement.dataset.ready = "";
    timer = window.setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

const getSnapshot = () => (now ??= new Date());
const getServerSnapshot = () => null;

export const useNow = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
