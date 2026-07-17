import { TimeBounds } from '@cupola/core';

/** Shifts the window by a fraction of its span (positive pans forward in time). */
export function panBounds(bounds: TimeBounds, fractionOfSpan: number): TimeBounds {
  const span = bounds.end - bounds.start;
  const shift = span * fractionOfSpan;
  return { start: bounds.start + shift, end: bounds.end + shift };
}

/**
 * Scales the window about a focal point. `factor < 1` zooms in (narrows the span);
 * `factor > 1` zooms out. `center` is the focus as a fraction of the span (0.5 =
 * middle), so button zoom keeps the centre and pointer zoom keeps the cursor fixed.
 */
export function zoomBounds(bounds: TimeBounds, factor: number, center = 0.5): TimeBounds {
  const span = bounds.end - bounds.start;
  const focus = bounds.start + span * center;
  const newSpan = span * factor;
  return {
    start: Math.round(focus - newSpan * center),
    end: Math.round(focus + newSpan * (1 - center)),
  };
}

/** Whether the requested bounds fall outside the currently loaded window. */
export function requiresReload(loaded: TimeBounds, requested: TimeBounds): boolean {
  return requested.start < loaded.start || requested.end > loaded.end;
}
