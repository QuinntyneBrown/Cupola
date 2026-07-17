import { LayoutItem } from './layout-model';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export type AlignEdge = 'left' | 'right' | 'top' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';
export type StackDirection = 'forward' | 'backward';

const MIN_SIZE = 1;

/** Snaps a fractional grid coordinate onto the layout grid. */
export function snapToGrid(value: number): number {
  return Math.round(value);
}

function clampPosition(value: number): number {
  return Math.max(0, value);
}

/** Moves the identified items by whole grid units, clamped to the canvas origin. */
export function moveItems(items: LayoutItem[], ids: string[], dx: number, dy: number): LayoutItem[] {
  const selected = new Set(ids);
  return items.map((item) =>
    selected.has(item.id)
      ? {
          ...item,
          x: clampPosition(snapToGrid(item.x + dx)),
          y: clampPosition(snapToGrid(item.y + dy)),
          ...(item.kind === 'line'
            ? {
                x2: clampPosition(snapToGrid((item.x2 ?? item.x) + dx)),
                y2: clampPosition(snapToGrid((item.y2 ?? item.y) + dy)),
              }
            : {}),
        }
      : item,
  );
}

/** Resizes one item from a drag handle, keeping the opposite edge anchored. */
export function resizeItem(
  items: LayoutItem[],
  id: string,
  handle: ResizeHandle,
  dx: number,
  dy: number,
): LayoutItem[] {
  return items.map((item) => {
    if (item.id !== id) {
      return item;
    }
    let { x, y, w, h } = item;
    if (handle.includes('e')) {
      w += dx;
    }
    if (handle.includes('s')) {
      h += dy;
    }
    if (handle.includes('w')) {
      x += dx;
      w -= dx;
    }
    if (handle.includes('n')) {
      y += dy;
      h -= dy;
    }
    w = Math.max(MIN_SIZE, snapToGrid(w));
    h = Math.max(MIN_SIZE, snapToGrid(h));
    return { ...item, x: clampPosition(snapToGrid(x)), y: clampPosition(snapToGrid(y)), w, h };
  });
}

/** Sets the rotation of the identified items, normalized to [0, 360). */
export function rotateItems(items: LayoutItem[], ids: string[], degrees: number): LayoutItem[] {
  const selected = new Set(ids);
  const normalized = ((degrees % 360) + 360) % 360;
  return items.map((item) =>
    selected.has(item.id) && item.kind !== 'line' ? { ...item, rotation: normalized } : item,
  );
}

/** Aligns the identified items to the extreme edge of their selection. */
export function alignItems(items: LayoutItem[], ids: string[], edge: AlignEdge): LayoutItem[] {
  const selected = items.filter((item) => ids.includes(item.id));
  if (selected.length < 2) {
    return items;
  }
  const target =
    edge === 'left'
      ? Math.min(...selected.map((item) => item.x))
      : edge === 'top'
        ? Math.min(...selected.map((item) => item.y))
        : edge === 'right'
          ? Math.max(...selected.map((item) => item.x + item.w))
          : Math.max(...selected.map((item) => item.y + item.h));
  const chosen = new Set(ids);
  return items.map((item) => {
    if (!chosen.has(item.id)) {
      return item;
    }
    switch (edge) {
      case 'left':
        return { ...item, x: target };
      case 'right':
        return { ...item, x: clampPosition(target - item.w) };
      case 'top':
        return { ...item, y: target };
      case 'bottom':
        return { ...item, y: clampPosition(target - item.h) };
    }
  });
}

/** Distributes three or more items evenly between the selection extremes. */
export function distributeItems(
  items: LayoutItem[],
  ids: string[],
  axis: DistributeAxis,
): LayoutItem[] {
  const selected = items.filter((item) => ids.includes(item.id));
  if (selected.length < 3) {
    return items;
  }
  const key = axis === 'horizontal' ? 'x' : 'y';
  const ordered = [...selected].sort((a, b) => a[key] - b[key]);
  const first = ordered[0][key];
  const last = ordered[ordered.length - 1][key];
  const step = (last - first) / (ordered.length - 1);
  const positions = new Map(ordered.map((item, index) => [item.id, snapToGrid(first + step * index)]));
  return items.map((item) =>
    positions.has(item.id) ? { ...item, [key]: positions.get(item.id)! } : item,
  );
}

/**
 * Moves the identified items one step forward or backward in stacking order,
 * then renumbers z densely in stacking order.
 */
export function reorderStack(
  items: LayoutItem[],
  ids: string[],
  direction: StackDirection,
): LayoutItem[] {
  const byStack = [...items].sort((a, b) => a.z - b.z);
  const selected = new Set(ids);
  if (direction === 'forward') {
    for (let index = byStack.length - 2; index >= 0; index -= 1) {
      if (selected.has(byStack[index].id) && !selected.has(byStack[index + 1].id)) {
        [byStack[index], byStack[index + 1]] = [byStack[index + 1], byStack[index]];
      }
    }
  } else {
    for (let index = 1; index < byStack.length; index += 1) {
      if (selected.has(byStack[index].id) && !selected.has(byStack[index - 1].id)) {
        [byStack[index], byStack[index - 1]] = [byStack[index - 1], byStack[index]];
      }
    }
  }
  const zByItem = new Map(byStack.map((item, index) => [item.id, index]));
  return items.map((item) => ({ ...item, z: zByItem.get(item.id)! }));
}
