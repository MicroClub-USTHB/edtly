"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDragState, type DropTarget } from "./timetable-dnd";

const LAYERS = {
  cell: "-inset-1 rounded-chip",
  week: "-inset-0.5 rounded-banner",
  row: "-inset-1 rounded-3xl",
  pill: "inset-0 rounded-full",
  chip: "inset-0 rounded-chip",
} as const;

type DropZoneProps = {
  id: string;
  target: DropTarget;
  disabled?: boolean;
  shape: keyof typeof LAYERS;
  className?: string;
  children?: ReactNode;
};

export function DropZone({
  id,
  target,
  disabled = false,
  shape,
  className,
  children,
}: DropZoneProps) {
  const { setNodeRef } = useDroppable({ id, data: target, disabled });
  const drag = useDragState();
  const active = drag.source !== null && !disabled;
  const over = active && drag.overId === id && drag.landing !== null;
  const warning = over && drag.conflict !== null;

  return (
    <div
      ref={setNodeRef}
      data-drop-id={id}
      data-drop-state={over ? (warning ? "warning" : "over") : active ? "ready" : undefined}
      className={cn("relative isolate", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -z-10 border border-dashed border-transparent opacity-0 transition-[opacity,background-color,border-color] duration-150 ease-out motion-reduce:transition-none",
          LAYERS[shape],
          active && "border-primary/30 opacity-100",
          over && "border-solid border-primary bg-tint",
          warning && "border-warning bg-warning-tint",
          drag.keyboard && "transition-none",
        )}
      />
      {children}
    </div>
  );
}
