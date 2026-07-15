import { Injectable } from '@angular/core';

import { TimeSystem } from '../models/time';

/**
 * Registry of time systems keyed by {@link TimeSystem.key}. Registering a
 * definition makes the time system available for activation; activation
 * accepts only a registered key. Requirements: OMCT-C05-L2-01.01,
 * OMCT-C05-L2-01.02.
 */
@Injectable({ providedIn: 'root' })
export class TimeSystemRegistry {
  private readonly systems = new Map<string, TimeSystem>();

  register(system: TimeSystem): void {
    this.systems.set(system.key, system);
  }

  get(key: string): TimeSystem | undefined {
    return this.systems.get(key);
  }

  has(key: string): boolean {
    return this.systems.has(key);
  }

  list(): TimeSystem[] {
    return [...this.systems.values()];
  }
}
