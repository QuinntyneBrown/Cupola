import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { DEFAULT_CLOCK_CONFIGURATION } from './clock-configuration';
import { ClockViewComponent } from './clock-view.component';

/** Provides the clock view for objects of type `clock`. OMCT-C05-L2-05.03. */
export class ClockViewProvider implements ViewProvider {
  readonly key = 'clock';
  readonly name = 'Clock';
  readonly glyph = 'i-clock';

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'clock';
  }

  view(object: DomainObject): CupolaView {
    // The shared object model has no configuration slot yet (it arrives with
    // C03 authoring), so a default clock configuration is supplied here.
    return componentView(this.injector, ClockViewComponent, {
      object,
      config: DEFAULT_CLOCK_CONFIGURATION,
    });
  }
}
