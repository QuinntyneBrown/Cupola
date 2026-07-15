import { EnvironmentInjector, inject } from '@angular/core';
import { ViewRegistry } from '@cupola/core';

import { ClockViewProvider } from './clock-view-provider';
import { TimerViewProvider } from './timer-view-provider';

/**
 * Registers the C05 time display-object views (clock, timer). Called from an
 * app initializer. Requirements: OMCT-C05-L2-05.03, OMCT-C05-L2-05.04.
 */
export function registerTimeViews(): void {
  const registry = inject(ViewRegistry);
  const injector = inject(EnvironmentInjector);

  registry.register(new ClockViewProvider(injector));
  registry.register(new TimerViewProvider(injector));
}
