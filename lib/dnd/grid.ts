import {
  closestCenter,
  KeyboardCode,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type KeyboardCodes,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";

const DIRECTIONS: Partial<Record<string, { x: number; y: number }>> = {
  [KeyboardCode.Right]: { x: 1, y: 0 },
  [KeyboardCode.Left]: { x: -1, y: 0 },
  [KeyboardCode.Down]: { x: 0, y: 1 },
  [KeyboardCode.Up]: { x: 0, y: -1 },
};

export const KEYBOARD_CODES: KeyboardCodes = {
  start: [KeyboardCode.Space],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter],
};

export const slotCollision: CollisionDetection = (args) => {
  const containers = args.droppableContainers.filter((container) => {
    const rect = args.droppableRects.get(container.id);
    return Boolean(rect && rect.width > 0 && rect.height > 0);
  });
  const scoped = { ...args, droppableContainers: containers };
  if (!args.pointerCoordinates) return closestCenter(scoped);
  const within = pointerWithin(scoped);
  return within.length > 0 ? within : rectIntersection(scoped);
};

export const gridCoordinates: KeyboardCoordinateGetter = (
  event,
  { context, currentCoordinates },
) => {
  const direction = DIRECTIONS[event.code];
  const { collisionRect, droppableRects, droppableContainers, over } = context;
  if (!direction || !collisionRect) return undefined;
  event.preventDefault();

  const centerX = collisionRect.left + collisionRect.width / 2;
  const centerY = collisionRect.top + collisionRect.height / 2;
  let best: { x: number; y: number } | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const container of droppableContainers.getEnabled()) {
    if (container.id === over?.id) continue;
    const rect = droppableRects.get(container.id);
    if (!rect || rect.width === 0 || rect.height === 0) continue;
    const dx = rect.left + rect.width / 2 - centerX;
    const dy = rect.top + rect.height / 2 - centerY;
    const along = direction.x !== 0 ? dx * direction.x : dy * direction.y;
    if (along <= 2) continue;
    const across = direction.x !== 0 ? Math.abs(dy) : Math.abs(dx);
    const score = along + across * 3;
    if (score < bestScore) {
      bestScore = score;
      best = { x: dx, y: dy };
    }
  }

  return best
    ? { x: currentCoordinates.x + best.x, y: currentCoordinates.y + best.y }
    : currentCoordinates;
};
