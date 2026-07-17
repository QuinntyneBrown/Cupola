import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { GaugeViewComponent } from './gauge-view.component';

/** Gauge view for `gauge` objects (OMCT-C08-L1-03). */
export class GaugeViewProvider implements ViewProvider {
  readonly key = 'gauge';
  readonly name = 'Gauge';
  readonly glyph = 'i-gauge';
  readonly priority = 90;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'gauge';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, GaugeViewComponent, { object, objectPath });
  }
}
