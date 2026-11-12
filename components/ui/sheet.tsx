"use client";

import { X } from "lucide-react";
import {
  AnimatePresence,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type SheetAnchor = Pick<DOMRect, "top" | "bottom" | "left">;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  heading: ReactNode;
  anchor?: SheetAnchor | null;
  className?: string;
  children: ReactNode;
};

const POPOVER_WIDTH = 400;
const GUTTER = 16;
const GAP = 8;

function popoverStyle(anchor: SheetAnchor) {
  const left = Math.max(
    GUTTER,
    Math.min(anchor.left, window.innerWidth - POPOVER_WIDTH - GUTTER),
  );
  const below = window.innerHeight - anchor.bottom;
  return below >= anchor.top
    ? { left, top: anchor.bottom + GAP, maxHeight: below - GAP - GUTTER }
    : {
        left,
        bottom: window.innerHeight - anchor.top + GAP,
        maxHeight: anchor.top - GAP - GUTTER,
      };
}

const showModal = (dialog: HTMLDialogElement | null) => {
  if (dialog && !dialog.open) dialog.showModal();
};

export function Sheet({
  open,
  onClose,
  label,
  closeLabel,
  heading,
  anchor,
  className,
  children,
}: SheetProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const reduced = useReducedMotion();
  const dragControls = useDragControls();
  const popover = desktop && anchor;
  const fade = desktop || reduced;
  const enter = {
    duration: reduced ? DURATION.reduced : DURATION.sheet,
    ease: EASE_OUT,
  };
  const leave = {
    duration: reduced ? DURATION.reduced : DURATION.base,
    ease: EASE_OUT,
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 96 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <dialog
          ref={showModal}
          aria-label={label}
          onCancel={(event) => {
            event.preventDefault();
            onClose();
          }}
          className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground outline-none backdrop:bg-transparent"
        >
          <m.div
            aria-hidden="true"
            onClick={onClose}
            className={cn(
              "absolute inset-0",
              popover ? "bg-transparent" : "bg-backdrop",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: enter }}
            exit={{ opacity: 0, transition: leave }}
          />

          <m.div
            style={popover ? popoverStyle(anchor) : undefined}
            className={cn(
              "absolute flex flex-col gap-4 overflow-y-auto overscroll-contain bg-background px-5 pt-2.5 pb-6",
              popover
                ? "w-100 rounded-sheet border border-border pt-5 shadow-[0_12px_40px_rgb(30_22_21/0.14)]"
                : "inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-140 rounded-t-sheet pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2 lg:rounded-sheet lg:pt-5",
              className,
            )}
            initial={fade ? { opacity: 0 } : { y: "100%" }}
            animate={
              fade
                ? { opacity: 1, transition: enter }
                : { y: 0, transition: enter }
            }
            exit={
              fade
                ? { opacity: 0, transition: leave }
                : { y: "100%", transition: leave }
            }
            drag={fade ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={onDragEnd}
          >
            <div
              onPointerDown={(event) => dragControls.start(event)}
              className="flex touch-none flex-col gap-4"
            >
              <span
                aria-hidden="true"
                className="h-1 w-9 self-center rounded-full bg-border lg:hidden"
              />

              <div className="flex items-center justify-between gap-3">
                {heading}

                <button
                  type="button"
                  aria-label={closeLabel}
                  onClick={onClose}
                  className="-my-2 -mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground-secondary transition-colors duration-120 ease-out hover:bg-muted active:bg-muted-hover"
                >
                  <X size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>

            {children}
          </m.div>
        </dialog>
      )}
    </AnimatePresence>
  );
}
