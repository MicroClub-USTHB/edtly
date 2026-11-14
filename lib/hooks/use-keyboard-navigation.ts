import { useEffect, useEffectEvent } from "react";
import { DESKTOP_QUERY } from "./use-media-query";

type KeyboardHandlers = {
  onDay: (direction: 1 | -1) => void;
  onWeek: (direction: 1 | -1) => void;
  onToday: () => void;
};

export function useKeyboardNavigation({
  onDay,
  onWeek,
  onToday,
}: KeyboardHandlers) {
  const handle = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      document.documentElement.dataset.dragging !== undefined ||
      document.querySelector("dialog[open]")
    ) {
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest("input, textarea, select, [contenteditable='true']")
    ) {
      return;
    }

    const desktop = window.matchMedia(DESKTOP_QUERY).matches;
    const view = document.documentElement.dataset.view;
    if (!desktop && view === "settings") return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      if (desktop || view === "week") onWeek(direction);
      else onDay(direction);
    } else if (event.key === "t" || event.key === "T") {
      event.preventDefault();
      onToday();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handle(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
}
