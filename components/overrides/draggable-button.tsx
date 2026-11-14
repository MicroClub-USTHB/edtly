"use client";

import { useDraggable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { useMounted } from "@/lib/hooks/use-mounted";
import type { Session } from "@/lib/timetable/types";
import { cn } from "@/lib/utils";
import {
  useDragState,
  type DragSource,
  type DragSurface,
} from "./timetable-dnd";

type DraggableButtonProps = Omit<ComponentProps<"button">, "type"> & {
  dragId: string;
  session: Session;
  surface: DragSurface;
  label: string;
  draggable: boolean;
};

export function DraggableButton({
  dragId,
  session,
  surface,
  label,
  draggable,
  className,
  children,
  onKeyUp,
  ...props
}: DraggableButtonProps) {
  const t = useTranslations("Overrides");
  const mounted = useMounted();
  const { enabled } = useDragState();
  const active = draggable && enabled && mounted;
  const data: DragSource = { session, surface, label, className, children };
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: dragId,
    data,
    disabled: !active,
    attributes: { roleDescription: t("dragRole") },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...props}
      {...(active ? { ...attributes, ...listeners } : {})}
      onKeyUp={(event) => {
        if (active && event.key === " ") event.preventDefault();
        onKeyUp?.(event);
      }}
      data-dragging={isDragging ? "" : undefined}
      className={cn(
        className,
        active &&
          "cursor-grab select-none [-webkit-touch-callout:none] active:cursor-grabbing",
        isDragging && "opacity-35",
      )}
    >
      {children}
    </button>
  );
}
