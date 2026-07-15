import { TimerConfiguration } from './timer-configuration';

/**
 * The legacy persisted shape of a timer, where the display format lived under
 * `format` and neither `timerFormat` nor `direction` existed.
 */
export interface LegacyTimerConfiguration {
  timestamp?: number | null;
  format?: 'long' | 'short';
}

/**
 * Migrates a legacy timer configuration into the current structure, renaming
 * `format` to `timerFormat` and supplying the `direction` default.
 * Requirement: OMCT-C05-L2-05.05.
 */
export function migrateTimer(legacy: LegacyTimerConfiguration): TimerConfiguration {
  return {
    timestamp: legacy.timestamp ?? null,
    timerFormat: legacy.format ?? 'long',
    direction: 'countUp',
  };
}

/** Whether a persisted configuration is in the legacy (pre-migration) shape. */
export function isLegacyTimer(
  config: LegacyTimerConfiguration & Partial<TimerConfiguration>,
): boolean {
  return config.timerFormat === undefined && config.format !== undefined;
}
