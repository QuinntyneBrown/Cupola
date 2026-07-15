import { padNumber } from '@cupola/core';

/**
 * Display configuration for a clock domain object. Requirement:
 * OMCT-C05-L2-05.03.
 */
export interface ClockConfiguration {
  /** Whether the time is rendered in UTC or the host's local zone. */
  timezone: 'UTC' | 'local';
  /** 12- or 24-hour display. */
  hourFormat: 12 | 24;
  /** Whether to include seconds. */
  showSeconds?: boolean;
}

export const DEFAULT_CLOCK_CONFIGURATION: ClockConfiguration = {
  timezone: 'UTC',
  hourFormat: 24,
  showSeconds: true,
};

/** Formats an epoch-millisecond value according to the clock configuration. */
export function formatClock(value: number, config: ClockConfiguration): string {
  const date = new Date(value);
  const useUtc = config.timezone === 'UTC';
  let hours = useUtc ? date.getUTCHours() : date.getHours();
  const minutes = useUtc ? date.getUTCMinutes() : date.getMinutes();
  const seconds = useUtc ? date.getUTCSeconds() : date.getSeconds();

  let suffix = '';
  if (config.hourFormat === 12) {
    suffix = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12;
  }

  const parts = [padNumber(hours), padNumber(minutes)];
  if (config.showSeconds) {
    parts.push(padNumber(seconds));
  }
  return `${parts.join(':')}${suffix} ${config.timezone}`;
}
