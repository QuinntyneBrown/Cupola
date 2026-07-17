import { DurationFormat } from '@cupola/core';

/**
 * Temporal classification, duration formatting, and progress for plan
 * activities relative to a context "now" (OMCT-C12-L2-03.04). Pure functions so
 * the plan view and time list classify identically and tests can pin `now`.
 */
export type TemporalClass = 'past' | 'current' | 'future';

const durationFormat = new DurationFormat();

/** Classifies an activity as past, current, or future relative to `now`. */
export function classifyTemporal(start: number, end: number, now: number): TemporalClass {
  if (now < start) {
    return 'future';
  }
  if (now >= end) {
    return 'past';
  }
  return 'current';
}

/** Whether the activity is currently in progress (started, not yet ended). */
export function isInProgress(start: number, end: number, now: number): boolean {
  return now >= start && now < end;
}

/** Formats an activity's duration as `HH:mm:ss`. */
export function formatDuration(start: number, end: number): string {
  return durationFormat.format(Math.max(0, end - start));
}

/** The elapsed fraction (0–1) of an activity relative to `now`. */
export function progressFraction(start: number, end: number, now: number): number {
  if (now <= start) {
    return 0;
  }
  if (now >= end) {
    return 1;
  }
  const span = end - start;
  return span > 0 ? (now - start) / span : 1;
}

/** The elapsed percentage (0–100), rounded, of an activity relative to `now`. */
export function progressPercent(start: number, end: number, now: number): number {
  return Math.round(progressFraction(start, end, now) * 100);
}
