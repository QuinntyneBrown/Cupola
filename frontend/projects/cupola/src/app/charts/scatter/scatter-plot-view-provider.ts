import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { ScatterPlotViewComponent } from './scatter-plot-view.component';

/** Scatter plot view for `scatter-plot` objects (OMCT-C07-L2-04.03/04.04). */
export class ScatterPlotViewProvider implements ViewProvider {
  readonly key = 'scatter-plot';
  readonly name = 'Scatter Plot';
  readonly glyph = 'i-plot';
  readonly priority = 90;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'scatter-plot';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, ScatterPlotViewComponent, { object, objectPath });
  }
}
