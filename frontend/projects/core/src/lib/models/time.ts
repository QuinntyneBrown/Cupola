/**
 * B05 — Time coordination (contract skeleton).
 * Owner: C05 · Consumers: C06, C07, C08, C11, C12 · Stability: high.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

export interface TimeSystem {
  key: string;
  name: string;
  timeFormat: string; // key of a registered time format (OMCT-C05-L2-01.01)
}

export interface TimeBounds {
  start: number; // inclusive, in time-system units
  end: number; // inclusive; end >= start shall hold (OMCT-C05-L2-01.03)
}

export type TimeMode = 'fixed' | 'realtime';

export interface ClockOffsets {
  start: number; // negative offset from clock tick
  end: number; // positive offset from clock tick
}
