import { Injectable } from '@angular/core';

import { Clock } from './clock';

/**
 * Registry of clocks keyed by {@link Clock.key}. A time context activates a
 * clock only when it is registered here. Requirement: OMCT-C05-L2-03.02.
 */
@Injectable({ providedIn: 'root' })
export class ClockRegistry {
  private readonly clocks = new Map<string, Clock>();

  register(clock: Clock): void {
    this.clocks.set(clock.key, clock);
  }

  get(key: string): Clock | undefined {
    return this.clocks.get(key);
  }

  has(key: string): boolean {
    return this.clocks.has(key);
  }
}
