import { TimeBounds, condenseTimeLabels } from '@cupola/core';

import { LinearScale } from './scale';

/** A rendered axis tick: its data value, pixel offset along the axis, and label. */
export interface AxisTick {
  value: number;
  offset: number;
  label: string;
}

/** Builds ticks from data values, positioning each via the scale and labelling it. */
export function buildTicks(
  values: number[],
  scale: LinearScale,
  format: (value: number) => string,
): AxisTick[] {
  return values.map((value) => ({ value, offset: scale.scale(value), label: format(value) }));
}

/**
 * Builds time-axis ticks with condensed labels (shared dates collapsed via
 * {@link condenseTimeLabels}). The one x-axis tick builder for plot views.
 */
export function buildTimeTicks(
  values: number[],
  scale: LinearScale,
  formatTime: (value: number) => string,
): AxisTick[] {
  const ticks = buildTicks(values, scale, formatTime);
  const labels = condenseTimeLabels(ticks.map((tick) => tick.label));
  return ticks.map((tick, index) => ({ ...tick, label: labels[index] }));
}

/** Evenly spaced domain (time) tick values across the active bounds (02.03). */
export function timeTickValues(bounds: TimeBounds, count = 6): number[] {
  const span = bounds.end - bounds.start;
  if (span <= 0 || count < 2) {
    return [bounds.start];
  }
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, index) => bounds.start + index * step);
}
