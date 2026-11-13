"use client";

import { animate } from "motion/mini";
import { useEffect, useRef, type TouchEvent } from "react";
import { minutesNow } from "@/lib/dates";
import type { Week } from "@/lib/hooks/use-week";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { useSelectedDay } from "@/lib/stores/view-store";
import type { Conflicts, DayStatus, Matcher } from "@/lib/timetable/schedule";
import { DAYS, type Session } from "@/lib/timetable/types";
import { DayPanel, type OpenSlot } from "./day-panel";

type DayPanelsProps = {
  sessions: Session[];
  group: string | null;
  mine: Matcher;
  week: Week;
  weekOffset: number;
  status: DayStatus | null;
  conflicts: Conflicts;
  showGaps: boolean;
  filtered: boolean;
  changed: ReadonlySet<string>;
  onOpen: OpenSlot;
  onStep: (direction: 1 | -1) => void;
  onClearFilters: () => void;
};

const SWIPE_DISTANCE = 56;

export function DayPanels({
  sessions,
  group,
  mine,
  week,
  weekOffset,
  status,
  conflicts,
  showGaps,
  filtered,
  changed,
  onOpen,
  onStep,
  onClearFilters,
}: DayPanelsProps) {
  const selected = useSelectedDay();
  const container = useRef<HTMLDivElement>(null);
  const previous = useRef<number | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const position =
    selected === null ? null : weekOffset * DAYS.length + selected;

  useEffect(() => {
    const from = previous.current;
    previous.current = position;
    if (
      selected === null ||
      position === null ||
      from === null ||
      from === position
    ) {
      return;
    }

    const panel = container.current?.querySelector(
      `[data-day-panel="${selected}"]`,
    );
    if (!panel) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const offset = reduced ? 0 : position > from ? 12 : -12;
    animate(
      panel,
      {
        opacity: [0, 1],
        transform: [`translateX(${offset}px)`, "translateX(0px)"],
      },
      { duration: reduced ? DURATION.reduced : DURATION.base, ease: EASE_OUT },
    );
  }, [position, selected]);

  const onTouchStart = (event: TouchEvent) => {
    const { clientX, clientY } = event.touches[0];
    touch.current = { x: clientX, y: clientY };
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;

    const { clientX, clientY } = event.changedTouches[0];
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) {
      return;
    }
    onStep(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={container}
      data-view-panel="day"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="flex-1 flex-col px-gutter pb-4"
    >
      {DAYS.map((day, index) => {
        const today = week.now && week.today === index;
        return (
          <DayPanel
            key={day}
            index={index}
            sessions={sessions}
            group={group}
            mine={mine}
            minutes={today ? minutesNow(week.now!) : null}
            status={today ? status : null}
            conflicts={conflicts}
            showGaps={showGaps}
            filtered={filtered}
            changed={changed}
            onOpen={onOpen}
            onClearFilters={onClearFilters}
          />
        );
      })}
    </div>
  );
}
