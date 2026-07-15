import { ClockRegistry } from './clock-registry';
import { TimeContextBase } from './time-context-base';
import { TimeSystemRegistry } from './time-system-registry';

/**
 * A time context scoped to a single object in the hierarchy. Its bounds, mode,
 * and clock state are independent of the global context. Created by
 * {@link TimeApiService}. Requirement: OMCT-C05-L2-02.02.
 */
export class IndependentTimeContext extends TimeContextBase {
  constructor(systems: TimeSystemRegistry, clocks: ClockRegistry) {
    super(systems, clocks);
  }
}
