import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { DEFAULT_TIMER_CONFIGURATION } from './timer-configuration';
import { TimerViewComponent } from './timer-view.component';

/** Provides the timer view for objects of type `timer`. OMCT-C05-L2-05.04. */
export class TimerViewProvider implements ViewProvider {
  readonly key = 'timer';
  readonly name = 'Timer';
  readonly glyph = 'i-clock';

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'timer';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.injector, TimerViewComponent, {
      object,
      config: DEFAULT_TIMER_CONFIGURATION,
    });
  }
}
