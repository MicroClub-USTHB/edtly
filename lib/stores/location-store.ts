import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const readSearch = () => window.location.search;

export function replaceUrl(url: string) {
  window.history.replaceState(null, "", url);
  listeners.forEach((listener) => listener());
}

export function useSearchParam(name: string) {
  const search = useSyncExternalStore(subscribe, readSearch, () => "");
  return new URLSearchParams(search).get(name);
}
