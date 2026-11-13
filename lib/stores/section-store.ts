import { useEffect, useSyncExternalStore } from "react";
import type { Section } from "@/lib/timetable/types";

export type RemoteSectionData = {
  programme: {
    level: string;
    speciality: { id: string; name: string };
    sectionCount: number;
    sourceUrl: string;
  };
  section: Section;
};

export type RemoteEntry =
  | { status: "loading" }
  | { status: "ready"; data: RemoteSectionData }
  | { status: "error" };

const EMPTY: ReadonlyMap<string, RemoteEntry> = new Map();
const listeners = new Set<() => void>();
let entries = EMPTY;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

function set(path: string, entry: RemoteEntry) {
  const next = new Map(entries);
  next.set(path, entry);
  entries = next;
  listeners.forEach((listener) => listener());
}

const isSectionData = (value: unknown): value is RemoteSectionData => {
  const data = value as RemoteSectionData | null;
  return Array.isArray(data?.section?.sessions) && Boolean(data?.programme);
};

export function loadSection(path: string, retry = false) {
  const current = entries.get(path);
  if (current && !(retry && current.status === "error")) return;
  set(path, { status: "loading" });
  fetch(`/api/sections${path}`)
    .then((response) => (response.ok ? response.json() : null))
    .then(
      (data: unknown) =>
        set(path, isSectionData(data) ? { status: "ready", data } : { status: "error" }),
      () => set(path, { status: "error" }),
    );
}

export function useRemoteSections(paths: string[]) {
  const all = useSyncExternalStore(
    subscribe,
    () => entries,
    () => EMPTY,
  );
  const key = paths.join("\n");

  useEffect(() => {
    if (key) key.split("\n").forEach((path) => loadSection(path));
  }, [key]);

  return all;
}
