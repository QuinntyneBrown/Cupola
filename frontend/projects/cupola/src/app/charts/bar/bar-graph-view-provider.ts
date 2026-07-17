import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { BarGraphViewComponent } from './bar-graph-view.component';

/** Bar graph view for `bar-graph` objects (OMCT-C07-L2-04.01/04.02). */
export class BarGraphViewProvider implements ViewProvider {
  readonly key = 'bar-graph';
  readonly name = 'Bar Graph';
  readonly glyph = 'i-plot';
  readonly priority = 90;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'bar-graph';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, BarGraphViewComponent, { object, objectPath });
  }
}
