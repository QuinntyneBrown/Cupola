import { TimeBounds } from '@cupola/core';

/** A single time-axis label positioned by percentage offset. */
export interface AxisTick {
  leftPct: number;
  label: string;
}

/**
 * Builds evenly spaced axis ticks across the bounds (OMCT-C12-L2-01.02, 02.02),
 * labelled by the supplied time formatter. Shared by the plan view, gantt chart,
 * and time-strip axis so every surface reads the same scale.
 */
export function buildAxisTicks(
  bounds: TimeBounds,
  formatTime: (value: number) => string,
  count = 6,
): AxisTick[] {
  if (bounds.end <= bounds.start || count < 1) {
    return [];
  }
  const span = bounds.end - bounds.start;
  const ticks: AxisTick[] = [];
  for (let index = 0; index <= count; index += 1) {
    const time = bounds.start + (span * index) / count;
    ticks.push({ leftPct: (index / count) * 100, label: formatTime(time) });
  }
  return ticks;
}
