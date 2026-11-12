"use client";

import { animate } from "motion/mini";
import { useEffect, useRef, type TouchEvent } from "react";
import type { SheetAnchor } from "@/components/ui/sheet";
import { minutesNow } from "@/lib/dates";
import type { Week } from "@/lib/hooks/use-week";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { setDay, useSelectedDay } from "@/lib/stores/view-store";
import type { Slot } from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { DayPanel } from "./day-panel";

type DayPanelsProps = {
  sessions: Session[];
  group: string | null;
  week: Week;
  changed: ReadonlySet<string>;
  onOpen: (dayIndex: number, slot: Slot, anchor: SheetAnchor) => void;
};

const SWIPE_DISTANCE = 56;

export function DayPanels({
  sessions,
  group,
  week,
  changed,
  onOpen,
}: DayPanelsProps) {
  const selected = useSelectedDay();
  const container = useRef<HTMLDivElement>(null);
  const previous = useRef<number | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const from = previous.current;
    previous.current = selected;
    if (selected === null || from === null || from === selected) return;

    const panel = container.current?.querySelector(
      `[data-day-panel="${selected}"]`,
    );
    if (!panel) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const offset = reduced ? 0 : selected > from ? 12 : -12;
    animate(
      panel,
      {
        opacity: [0, 1],
        transform: [`translateX(${offset}px)`, "translateX(0px)"],
      },
      { duration: reduced ? DURATION.reduced : DURATION.base, ease: EASE_OUT },
    );
  }, [selected]);

  const onTouchStart = (event: TouchEvent) => {
    const { clientX, clientY } = event.touches[0];
    touch.current = { x: clientX, y: clientY };
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start || selected === null) return;

    const { clientX, clientY } = event.changedTouches[0];
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) {
      return;
    }

    const next = selected + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < DAYS.length) setDay(next);
  };

  return (
    <div
      ref={container}
      data-view-panel="day"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="flex-1 flex-col px-gutter pb-4"
    >
      {DAYS.map((day, index) => (
        <DayPanel
          key={day}
          index={index}
          sessions={sessions}
          group={group}
          minutes={week.now && week.today === index ? minutesNow(week.now) : null}
          changed={changed}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
