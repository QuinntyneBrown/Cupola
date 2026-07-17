import { TimeBounds } from '@cupola/core';

/**
 * Maps epoch-millisecond times to horizontal percentage offsets within a set of
 * time bounds (OMCT-C12-L2-01.02). Shared by swimlanes, time strips, and event
 * tracks so every child aligns to the same axis.
 */
export interface TimeScale {
  readonly bounds: TimeBounds;
  /** The percentage offset (0–100) of a time within the bounds. */
  offset(time: number): number;
  /** The clamped percentage offset (0–100), never leaving the visible range. */
  clampedOffset(time: number): number;
  /** The percentage width spanning [start, end], clamped to the visible range. */
  width(start: number, end: number): number;
  /** Whether a time falls within the bounds, inclusive. */
  contains(time: number): boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Builds a {@link TimeScale} for the given bounds. */
export function createTimeScale(bounds: TimeBounds): TimeScale {
  const span = bounds.end - bounds.start;
  const offset = (time: number): number => {
    if (!(span > 0)) {
      return 0;
    }
    return ((time - bounds.start) / span) * 100;
  };
  const clampedOffset = (time: number): number => clamp(offset(time), 0, 100);
  return {
    bounds,
    offset,
    clampedOffset,
    width: (start, end) => Math.max(0, clampedOffset(end) - clampedOffset(start)),
    contains: (time) => time >= bounds.start && time <= bounds.end,
  };
}
