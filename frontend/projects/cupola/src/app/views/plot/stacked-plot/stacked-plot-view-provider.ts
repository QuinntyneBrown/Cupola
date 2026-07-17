import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { StackedPlotViewComponent } from './stacked-plot-view.component';

/** Stacked plot view for `stacked-plot` objects (OMCT-C07-L2-01.04). */
export class StackedPlotViewProvider implements ViewProvider {
  readonly key = 'plot-stacked';
  readonly name = 'Stacked Plot';
  readonly glyph = 'i-plot';
  readonly priority = 92;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'stacked-plot';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, StackedPlotViewComponent, { object, objectPath });
  }
}
