import { computed, signal } from '@angular/core';
import { StatusIndicator } from '@cupola/core';

/**
 * UTC clock indicator, updated once per second for the application lifetime.
 * Requirement: OMCT-C14-L2-05.01 (registered indicator).
 */
export function createClockIndicator(): StatusIndicator {
  const clock = signal(formatUtc(new Date()));
  setInterval(() => clock.set(formatUtc(new Date())), 1000);
  return {
    key: 'clock',
    priority: 80,
    glyph: 'i-clock',
    textSignal: computed(() => `${clock()} UTC`),
  };
}

function formatUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
