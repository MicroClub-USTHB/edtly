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
  size?: keyof typeof widths;
  className?: string;
  children: ReactNode;
};

const widths = {
  default: { px: 400, className: "w-100" },
  wide: { px: 560, className: "w-140" },
} as const;

const GUTTER = 16;
const GAP = 8;

function popoverStyle(anchor: SheetAnchor, width: number) {
  const left = Math.max(
    GUTTER,
    Math.min(anchor.left, window.innerWidth - width - GUTTER),
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

function showModal(dialog: HTMLDialogElement | null) {
  if (!dialog || dialog.open) return;
  const { scrollX, scrollY } = window;
  dialog.showModal();
  dialog.scrollTop = 0;
  if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
    window.scrollTo(scrollX, scrollY);
  }
}

export function Sheet({
  open,
  onClose,
  label,
  closeLabel,
  heading,
  anchor,
  size = "default",
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
          className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-clip border-0 bg-transparent p-0 text-foreground outline-none backdrop:bg-transparent"
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
            style={popover ? popoverStyle(anchor, widths[size].px) : undefined}
            className={cn(
              "absolute flex flex-col overflow-hidden bg-background",
              popover
                ? cn(
                    widths[size].className,
                    "rounded-sheet border border-border shadow-[0_12px_40px_rgb(30_22_21/0.14)]",
                  )
                : "inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-140 rounded-t-sheet lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2 lg:rounded-sheet",
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
              className={cn(
                "flex shrink-0 touch-none flex-col gap-4 px-5 pt-2.5 pb-4",
                (popover || desktop) && "pt-5",
              )}
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

            <div
              className={cn(
                "scrollbar-subtle mr-1.5 mb-3 flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain pr-3.5 pb-3 pl-5",
                !popover &&
                  "mb-[max(0.75rem,env(safe-area-inset-bottom))] lg:mb-3",
                className,
              )}
            >
              {children}
            </div>
          </m.div>
        </dialog>
      )}
    </AnimatePresence>
  );
}
