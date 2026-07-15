import { Injectable, inject } from '@angular/core';

import { ClockRegistry } from './clock-registry';
import { TimeContextBase } from './time-context-base';
import { TimeSystemRegistry } from './time-system-registry';

/**
 * The application-wide time context. Bound to the {@link TimeContext} token so
 * every consumer that does not resolve an independent context shares it.
 * Requirement: OMCT-C05-L2-02.01.
 */
@Injectable({ providedIn: 'root' })
export class GlobalTimeContext extends TimeContextBase {
  constructor() {
    super(inject(TimeSystemRegistry), inject(ClockRegistry));
  }
}
