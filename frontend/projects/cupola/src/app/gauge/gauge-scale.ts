import { DomainObject, LimitRegistry } from '@cupola/core';

import { GaugeConfiguration } from './gauge-config';

/** The resolved gauge scale: range extremes plus optional limit markers. */
export interface GaugeScale {
  min: number;
  max: number;
  low?: number; // low-limit marker
  high?: number; // high-limit marker
}

/** A large probe value that forces the widest (critical) limit band, if any. */
const CRITICAL_PROBE = 1e9;

/**
 * Resolves the gauge scale and limit markers (OMCT-C08-L2-03.03). Manual bounds
 * come straight from the configuration; telemetry-derived bounds probe the limit
 * registry for the critical band and frame the range around it, falling back to
 * the configured bounds when no limits apply.
 */
export function resolveScale(
  config: GaugeConfiguration,
  object: DomainObject | undefined,
  limits: LimitRegistry,
): GaugeScale {
  if (config.boundsMode === 'manual' || !object) {
    return { min: config.min, max: config.max, low: config.limitLow, high: config.limitHigh };
  }
  const probe = limits.evaluate(
    { keyString: object.keyString, timestamp: new Date().toISOString(), value: CRITICAL_PROBE },
    object,
  );
  if (probe && (probe.low !== undefined || probe.high !== undefined)) {
    const low = probe.low ?? 0;
    const high = probe.high ?? 1;
    const pad = Math.max((high - low) * 0.25, 1);
    return { min: low - pad, max: high + pad, low, high };
  }
  return { min: config.min, max: config.max, low: config.limitLow, high: config.limitHigh };
}

/** Clamps a value to a 0–1 fraction of the scale span. */
export function valueFraction(value: number, scale: GaugeScale): number {
  if (scale.max === scale.min) {
    return 0;
  }
  return Math.min(1, Math.max(0, (value - scale.min) / (scale.max - scale.min)));
}

/** A value's position along the scale as a CSS percentage string. */
export function percent(value: number | undefined, scale: GaugeScale): string {
  return value === undefined ? '0%' : `${valueFraction(value, scale) * 100}%`;
}
