"use client";

import { TriangleAlert } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import {
  DURATION,
  ms,
  prefersReducedMotion,
  springEasing,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { DragSource, DragSurface } from "./timetable-dnd";

const LIFT: Record<DragSurface, string> = {
  desktop: "scale(1.035) rotate(-1deg)",
  day: "scale(1.025)",
  week: "scale(1.08)",
};

const RADIUS: Record<DragSurface, string> = {
  desktop: "rounded-banner",
  day: "rounded-session",
  week: "rounded-cell",
};

type DragLiftProps = {
  source: DragSource;
  pill: string | null;
  warning: boolean;
  still: boolean;
};

export function DragLift({ source, pill, warning, still }: DragLiftProps) {
  const lift = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLSpanElement>(null);
  const { surface } = source;

  useLayoutEffect(() => {
    const options = {
      duration: ms(DURATION.lift),
      easing: springEasing(),
      fill: "forwards" as const,
    };
    if (!still && !prefersReducedMotion()) {
      lift.current?.animate(
        [{ transform: "none" }, { transform: LIFT[surface] }],
        options,
      );
    }
    shadow.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
      ...options,
      duration: still ? 0 : ms(DURATION.base),
    });
  }, [still, surface]);

  return (
    <div
      ref={lift}
      data-drag-lift=""
      className={cn(
        "relative flex size-full cursor-grabbing will-change-transform",
        RADIUS[surface],
      )}
    >
      <span
        ref={shadow}
        data-drag-shadow=""
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 shadow-[0_18px_40px_rgb(30_22_21/0.2),0_3px_8px_rgb(30_22_21/0.1)] dark:shadow-[0_18px_40px_rgb(0_0_0/0.55),0_3px_8px_rgb(0_0_0/0.4)]",
          RADIUS[surface],
        )}
      />

      <div
        className={cn(
          source.className,
          "pointer-events-none relative size-full min-w-0",
        )}
      >
        {source.children}
      </div>

      <span
        data-drag-pill=""
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-2 flex max-w-[min(18rem,80vw)] -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-meta whitespace-nowrap shadow-[0_6px_18px_rgb(30_22_21/0.18)] transition-opacity duration-150 ease-out motion-reduce:transition-none",
          warning
            ? "bg-warning-tint text-warning"
            : "bg-foreground text-background",
          pill ? "opacity-100" : "opacity-0",
        )}
      >
        {warning && (
          <TriangleAlert
            size={12}
            strokeWidth={2}
            aria-hidden="true"
            className="shrink-0"
          />
        )}
        <span className="truncate">{pill}</span>
      </span>
    </div>
  );
}
