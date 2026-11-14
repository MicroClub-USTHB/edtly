"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { ConflictNote } from "@/components/timetable/conflict-note";
import { minutesOf } from "@/lib/dates";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { useDuration } from "@/lib/hooks/use-duration";
import { useSessionLabels } from "@/lib/hooks/use-session-labels";
import {
  durationOf,
  sameSlot,
  slotOf,
  stateOf,
  withDuration,
  type SessionState,
} from "@/lib/timetable/overrides";
import { STANDARD_SLOTS } from "@/lib/timetable/schedule";
import {
  DAYS,
  type Day,
  type OverrideScope,
  type Session,
  type SessionSlot,
} from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import { ScopeOptions, type ScopeContext } from "./scope-options";

const DURATIONS = [60, 90, 120, 180];
const LATEST = 23 * 60 + 59;

const choice = (selected: boolean) =>
  cn(
    "flex h-11 min-w-0 items-center justify-center rounded-full border text-label tabular-nums select-none transition-[color,background-color,border-color] duration-120 ease-out motion-reduce:transition-none",
    selected
      ? "border-tint-strong bg-tint text-tint-foreground"
      : "border-border bg-surface text-foreground hover:border-border-strong active:bg-muted",
  );

type EditFormProps = {
  session: Session;
  context: ScopeContext;
  conflictFor: (session: Session, slot: SessionSlot) => Session | null;
  onSave: (scope: OverrideScope, state: SessionState) => void;
};

export function EditForm({ session, context, conflictFor, onSave }: EditFormProps) {
  const t = useTranslations("Overrides");
  const short = useTranslations("Days.short");
  const long = useTranslations("Days.long");
  const formatDuration = useDuration();
  const labels = useSessionLabels();
  const changes = useChangeLabels();
  const id = useId();
  const [day, setDay] = useState<Day>(session.day);
  const [start, setStart] = useState(session.start);
  const [minutes, setMinutes] = useState(durationOf(session));
  const [room, setRoom] = useState(session.room);

  const startMinutes = minutesOf(start);
  const valid = /^\d{2}:\d{2}$/.test(start) && startMinutes + minutes <= LATEST;
  const slot: SessionSlot = {
    day,
    start,
    end: valid ? withDuration(start, minutes) : start,
    room: room.trim(),
  };
  const unchanged = sameSlot(slot, slotOf(session));
  const overlap = valid ? conflictFor(session, slot) : null;
  const conflict = overlap ? labels.conflict([overlap]) : undefined;
  const durations = [...new Set([...DURATIONS, durationOf(session)])].sort(
    (a, b) => a - b,
  );

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-overline text-foreground-muted uppercase">
          {t("day")}
        </legend>
        <div className="grid grid-cols-6 gap-1.5">
          {DAYS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={day === value}
              aria-label={long(value)}
              onClick={() => setDay(value)}
              className={cn(choice(day === value), "px-0 text-sm")}
            >
              {short(value)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-overline text-foreground-muted uppercase">
          {t("start")}
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {STANDARD_SLOTS.map((option) => (
            <button
              key={option.start}
              type="button"
              aria-pressed={start === option.start}
              onClick={() => setStart(option.start)}
              className={choice(start === option.start)}
            >
              {option.start}
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 pt-1 text-note text-foreground-secondary">
          {t("otherTime")}
          <input
            type="time"
            step={300}
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="h-11 w-38 rounded-full border border-border bg-surface px-4 text-label text-foreground tabular-nums"
          />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-overline text-foreground-muted uppercase">
          {t("duration")}
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {durations.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={minutes === value}
              onClick={() => setMinutes(value)}
              className={cn(choice(minutes === value), "px-4")}
            >
              {formatDuration(value)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-room`}
          className="text-overline text-foreground-muted uppercase"
        >
          {t("room")}
        </label>
        <input
          id={`${id}-room`}
          value={room}
          maxLength={40}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setRoom(event.target.value)}
          className="h-11 rounded-full border border-border bg-surface px-4 text-label text-foreground"
        />
      </div>

      <div
        aria-live="polite"
        className="flex flex-col gap-1.5 rounded-session bg-muted px-4.5 py-3.5"
      >
        <span className="text-overline text-foreground-muted uppercase">
          {t("preview")}
        </span>
        <span className="text-label">
          {valid ? changes.slot(slot, true) : t("invalidTime")}
        </span>
        {conflict && <ConflictNote text={conflict} />}
      </div>

      <ScopeOptions
        context={context}
        disabled={!valid || unchanged}
        onChoose={(scope) => onSave(scope, stateOf(slot))}
      />
    </form>
  );
}
