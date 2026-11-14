"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimationFunction,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useTranslations } from "next-intl";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { SheetAnchor } from "@/components/ui/sheet";
import { gridCoordinates, KEYBOARD_CODES, slotCollision } from "@/lib/dnd/grid";
import { useChangeLabels } from "@/lib/hooks/use-change-labels";
import { useMounted } from "@/lib/hooks/use-mounted";
import {
  DURATION,
  easeOutCss,
  ms,
  prefersReducedMotion,
  springEasing,
} from "@/lib/motion";
import {
  durationOf,
  sameSlot,
  slotOf,
  withDuration,
} from "@/lib/timetable/overrides";
import type { Slot } from "@/lib/timetable/schedule";
import { DAYS, type Day, type Session, type SessionSlot } from "@/lib/timetable/types";
import { DragLift } from "./drag-lift";

export type DragSurface = "desktop" | "day" | "week";

export type DragSource = {
  session: Session;
  surface: DragSurface;
  label: string;
  className?: string;
  children: ReactNode;
};

export type DropTarget =
  | { kind: "slot"; day: Day; slot: Slot; label: string }
  | { kind: "day"; day: Day; label: string };

export type MoveRequest = {
  session: Session;
  target: SessionSlot;
  anchor: SheetAnchor | null;
};

type DragState = {
  enabled: boolean;
  source: DragSource | null;
  overId: UniqueIdentifier | null;
  landing: SessionSlot | null;
  conflict: Session | null;
  keyboard: boolean;
};

const IDLE: Omit<DragState, "enabled"> = {
  source: null,
  overId: null,
  landing: null,
  conflict: null,
  keyboard: false,
};

const DragStateContext = createContext<DragState>({ ...IDLE, enabled: false });

export const useDragState = () => useContext(DragStateContext);

export function landingOf(session: Session, target: DropTarget): SessionSlot {
  const base = slotOf(session);
  if (target.kind === "day") return { ...base, day: target.day };
  return {
    ...base,
    day: target.day,
    start: target.slot.start,
    end: withDuration(target.slot.start, durationOf(session)),
  };
}

const SPRING_DELAY = 600;
const MODIFIERS = [restrictToWindowEdges];
const AUTO_SCROLL = { threshold: { x: 0.12, y: 0.14 } };

const translate = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;

function visiblePreview() {
  return (
    [...document.querySelectorAll<HTMLElement>("[data-drop-preview]")].find(
      (node) => node.getClientRects().length > 0,
    ) ?? null
  );
}

function zoneRect(id: UniqueIdentifier): SheetAnchor | null {
  const node = [
    ...document.querySelectorAll<HTMLElement>(`[data-drop-id="${String(id)}"]`),
  ].find((element) => element.getClientRects().length > 0);
  return node?.getBoundingClientRect() ?? null;
}

function settleLift(overlay: HTMLElement, duration: number) {
  const lift = overlay.querySelector<HTMLElement>("[data-drag-lift]");
  const shadow = overlay.querySelector<HTMLElement>("[data-drag-shadow]");
  const pill = overlay.querySelector<HTMLElement>("[data-drag-pill]");
  const options = { duration, easing: easeOutCss(), fill: "forwards" as const };
  if (lift) {
    lift.animate(
      [{ transform: getComputedStyle(lift).transform }, { transform: "none" }],
      options,
    );
  }
  shadow?.animate([{ opacity: getComputedStyle(shadow).opacity }, { opacity: 0 }], options);
  pill?.animate([{ opacity: getComputedStyle(pill).opacity }, { opacity: 0 }], {
    ...options,
    duration: ms(DURATION.press),
  });
}

type TimetableDndProps = {
  enabled: boolean;
  conflictAt: (session: Session, target: SessionSlot) => Session | null;
  onMove: (request: MoveRequest) => void;
  onHoverDay?: (dayIndex: number) => void;
  children: ReactNode;
};

export function TimetableDnd({
  enabled,
  conflictAt,
  onMove,
  onHoverDay,
  children,
}: TimetableDndProps) {
  const t = useTranslations("Overrides");
  const labels = useChangeLabels();
  const mounted = useMounted();
  const [state, setState] = useState(IDLE);
  const landingRef = useRef(false);
  const keyboardRef = useRef(false);
  const leftRef = useRef(false);
  const springRef = useRef<number | undefined>(undefined);

  const mouse = useSensor(MouseSensor, {
    activationConstraint: { distance: 6 },
  });
  const touch = useSensor(TouchSensor, {
    activationConstraint: { delay: 220, tolerance: 8 },
  });
  const keyboard = useSensor(KeyboardSensor, {
    coordinateGetter: gridCoordinates,
    keyboardCodes: KEYBOARD_CODES,
  });
  const sensors = useSensors(mouse, touch, keyboard);

  useEffect(
    () => () => {
      window.clearTimeout(springRef.current);
      delete document.documentElement.dataset.dragging;
    },
    [],
  );

  const sourceOf = (data: unknown) => (data as DragSource | undefined) ?? null;
  const targetOf = (data: unknown) => (data as DropTarget | undefined) ?? null;

  const resolve = (source: DragSource, target: DropTarget | null) => {
    if (!target) return null;
    const landing = landingOf(source.session, target);
    return sameSlot(landing, slotOf(source.session)) ? null : landing;
  };

  const finish = () => {
    window.clearTimeout(springRef.current);
    delete document.documentElement.dataset.dragging;
    setState(IDLE);
  };

  const onDragStart = ({ active, activatorEvent }: DragStartEvent) => {
    const source = sourceOf(active.data.current);
    if (!source) return;
    const viaKeyboard = activatorEvent instanceof KeyboardEvent;
    keyboardRef.current = viaKeyboard;
    leftRef.current = false;
    if (
      typeof TouchEvent !== "undefined" &&
      activatorEvent instanceof TouchEvent
    ) {
      navigator.vibrate?.(8);
    }
    document.documentElement.dataset.dragging = "";
    setState({ ...IDLE, source, keyboard: viaKeyboard });
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    const source = sourceOf(active.data.current);
    if (!source) return;
    const target = targetOf(over?.data.current);
    const landing = resolve(source, target);
    window.clearTimeout(springRef.current);
    if (target?.kind === "day" && onHoverDay) {
      const dayIndex = DAYS.indexOf(target.day);
      springRef.current = window.setTimeout(
        () => onHoverDay(dayIndex),
        SPRING_DELAY,
      );
    }
    setState((current) => ({
      ...current,
      overId: over?.id ?? null,
      landing,
      conflict: landing ? conflictAt(source.session, landing) : null,
    }));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const source = sourceOf(active.data.current);
    const target = targetOf(over?.data.current);
    finish();
    if (!source || !over || !target) return;
    const landing = resolve(source, target);
    if (!landing) return;
    landingRef.current = true;
    navigator.vibrate?.(6);
    onMove({ session: source.session, target: landing, anchor: zoneRect(over.id) });
  };

  const dropAnimation: DropAnimationFunction = ({
    active,
    dragOverlay,
    transform,
  }) => {
    const landed = landingRef.current;
    landingRef.current = false;
    if (keyboardRef.current || prefersReducedMotion()) return;

    const overlay = dragOverlay.node;
    const from = translate(transform.x, transform.y);

    if (landed) {
      const preview = visiblePreview();
      if (!preview) {
        settleLift(overlay, ms(DURATION.press));
        return overlay
          .animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: ms(DURATION.press),
            easing: easeOutCss(),
            fill: "forwards",
          })
          .finished.then(() => undefined, () => undefined);
      }
      const rect = preview.getBoundingClientRect();
      const scaleX = rect.width / dragOverlay.rect.width;
      const scaleY = rect.height / dragOverlay.rect.height;
      const x = transform.x + rect.left - dragOverlay.rect.left;
      const y = transform.y + rect.top - dragOverlay.rect.top;
      preview.style.visibility = "hidden";
      overlay.style.transformOrigin = "0 0";
      settleLift(overlay, ms(DURATION.base));
      return overlay
        .animate(
          [
            { transform: from },
            { transform: `${translate(x, y)} scale(${scaleX}, ${scaleY})` },
          ],
          { duration: ms(DURATION.land), easing: springEasing(), fill: "forwards" },
        )
        .finished.then(
          () => {
            preview.style.visibility = "";
          },
          () => {
            preview.style.visibility = "";
          },
        );
    }

    const x = transform.x + active.rect.left - dragOverlay.rect.left;
    const y = transform.y + active.rect.top - dragOverlay.rect.top;
    if (Math.abs(x - transform.x) + Math.abs(y - transform.y) < 1) return;
    active.node.style.opacity = "0";
    settleLift(overlay, ms(DURATION.base));
    return overlay
      .animate([{ transform: from }, { transform: translate(x, y) }], {
        duration: ms(DURATION.base),
        easing: easeOutCss(),
        fill: "forwards",
      })
      .finished.then(
        () => {
          active.node.style.opacity = "";
        },
        () => {
          active.node.style.opacity = "";
        },
      );
  };

  const nameOf = (data: unknown) => sourceOf(data)?.label ?? "";
  const placeOf = (data: unknown) => targetOf(data)?.label ?? "";

  const announcements: Announcements = {
    onDragStart: ({ active }) => t("announce.start", { session: nameOf(active.data.current) }),
    onDragOver: ({ active, over }) => {
      if (!over) return t("announce.outside");
      const source = sourceOf(active.data.current);
      const target = targetOf(over.data.current);
      const landing = source ? resolve(source, target) : null;
      if (!source || !landing) {
        return leftRef.current ? t("announce.home") : undefined;
      }
      leftRef.current = true;
      const conflict = conflictAt(source.session, landing);
      return conflict
        ? t("announce.overConflict", {
            target: placeOf(over.data.current),
            module: conflict.module,
          })
        : t("announce.over", { target: placeOf(over.data.current) });
    },
    onDragEnd: ({ active, over }) => {
      const source = sourceOf(active.data.current);
      const target = targetOf(over?.data.current);
      return source && target && resolve(source, target)
        ? t("announce.drop", { target: placeOf(over?.data.current) })
        : t("announce.cancel", { session: nameOf(active.data.current) });
    },
    onDragCancel: ({ active }) =>
      t("announce.cancel", { session: nameOf(active.data.current) }),
  };

  const pill = state.landing
    ? state.conflict
      ? t("pillConflict", {
          target: labels.compact(state.landing),
          module: state.conflict.module,
        })
      : labels.compact(state.landing)
    : null;

  return (
    <DragStateContext value={{ ...state, enabled }}>
      <DndContext
        sensors={sensors}
        collisionDetection={slotCollision}
        autoScroll={AUTO_SCROLL}
        accessibility={{
          restoreFocus: false,
          announcements,
          screenReaderInstructions: { draggable: t("instructions") },
        }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={finish}
      >
        {children}

        {mounted &&
          createPortal(
            <DragOverlay
              dropAnimation={dropAnimation}
              modifiers={MODIFIERS}
              transition="none"
              zIndex={60}
            >
              {state.source && (
                <DragLift
                  source={state.source}
                  pill={pill}
                  warning={state.conflict !== null}
                  still={state.keyboard}
                />
              )}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </DragStateContext>
  );
}
