import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { TimeSystem } from '../models/time';
import { Clock } from './clock';
import { ClockRegistry } from './clock-registry';
import { FormatRegistry } from './format-registry';
import { GlobalTimeContext } from './global-time-context';
import { IndependentTimeContext } from './independent-time-context';
import { TimeContext } from './time-context';
import { TimeFormat } from './time-format';
import { TimeSystemRegistry } from './time-system-registry';

/**
 * The time API facade: registration of time systems, clocks, and formats, and
 * resolution of the time context for an object path (global by default, or the
 * nearest independent context along the path).
 *
 * Requirements: OMCT-C05-L2-01.01, 02.01, 02.02, 02.03.
 */
@Injectable({ providedIn: 'root' })
export class TimeApiService {
  private readonly systems = inject(TimeSystemRegistry);
  private readonly clocks = inject(ClockRegistry);
  private readonly formats = inject(FormatRegistry);
  private readonly global = inject(GlobalTimeContext);
  private readonly independentByKey = new Map<string, IndependentTimeContext>();

  registerTimeSystem(system: TimeSystem): void {
    this.systems.register(system);
  }

  registerClock(clock: Clock): void {
    this.clocks.register(clock);
  }

  registerFormat(format: TimeFormat): void {
    this.formats.register(format);
  }

  /** The application-wide time context. */
  globalContext(): GlobalTimeContext {
    return this.global;
  }

  /** Creates and registers an independent context owned by an object. */
  addIndependentContext(keyString: string): IndependentTimeContext {
    const context = new IndependentTimeContext(this.systems, this.clocks);
    this.independentByKey.set(keyString, context);
    return context;
  }

  hasIndependentContext(keyString: string): boolean {
    return this.independentByKey.has(keyString);
  }

  removeIndependentContext(keyString: string): void {
    this.independentByKey.delete(keyString);
  }

  /**
   * Resolves the time context for an object path. Returns the nearest
   * independent context walking from the leaf toward the root; the global
   * context when the path declares none. `objectPath` is root-most first (the
   * navigated object is last), matching the browse path convention.
   *
   * Requirements: OMCT-C05-L2-02.01 (global default), 02.02 (own context),
   * 02.03 (nearest ancestor).
   */
  getContext(objectPath: DomainObject[]): TimeContext {
    for (let i = objectPath.length - 1; i >= 0; i--) {
      const context = this.independentByKey.get(objectPath[i].keyString);
      if (context) {
        return context;
      }
    }
    return this.global;
  }
}
