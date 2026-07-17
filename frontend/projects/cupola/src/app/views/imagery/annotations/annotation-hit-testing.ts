/**
 * Pixel-spatial annotation hit-testing over normalized [0,1] image coordinates
 * (OMCT-C11-L2-03.03): point-in-rectangle for clicks, axis-aligned rectangle
 * intersection for marquee selection.
 */
export interface NormalizedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NormalizedPoint {
  x: number;
  y: number;
}

export function pointInRect(point: NormalizedPoint, rect: NormalizedRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

export function rectsIntersect(a: NormalizedRect, b: NormalizedRect): boolean {
  return a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
}

/** Normalizes a drag from any corner into a positive-extent rectangle. */
export function normalizedRectFrom(start: NormalizedPoint, end: NormalizedPoint): NormalizedRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
  };
}
