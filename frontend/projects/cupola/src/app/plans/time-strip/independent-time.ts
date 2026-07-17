import { ClockOffsets, DomainObject, IndependentTimeContext, TimeBounds } from '@cupola/core';

/**
 * A time strip's optional independent-time configuration
 * (`configuration.independentTime`, OMCT-C12-L2-02.03).
 */
export interface IndependentTimeConfig {
  enabled: boolean;
  mode: 'fixed' | 'realtime';
  bounds?: TimeBounds;
  offsets?: ClockOffsets;
  clock?: string;
}

const DEFAULT_OFFSETS: ClockOffsets = { start: -900_000, end: 0 };

/** Reads a strip's independent-time configuration, or null when unset/disabled. */
export function readIndependentTime(object: DomainObject): IndependentTimeConfig | null {
  const raw = (object.configuration ?? {})['independentTime'] as Partial<IndependentTimeConfig> | undefined;
  if (!raw || !raw.enabled) {
    return null;
  }
  return {
    enabled: true,
    mode: raw.mode === 'realtime' ? 'realtime' : 'fixed',
    bounds: raw.bounds,
    offsets: raw.offsets,
    clock: raw.clock,
  };
}

/**
 * Applies an independent-time configuration to a scoped context: fixed bounds in
 * fixed mode, or the configured clock and offsets in realtime mode.
 */
export function applyIndependentConfig(
  context: IndependentTimeContext,
  config: IndependentTimeConfig,
): void {
  if (config.mode === 'realtime') {
    context.setClockOffsets(config.offsets ?? DEFAULT_OFFSETS);
    context.setClock(config.clock ?? 'local');
  } else {
    context.setClock(null);
    if (config.bounds) {
      context.setBounds(config.bounds);
    }
  }
}
