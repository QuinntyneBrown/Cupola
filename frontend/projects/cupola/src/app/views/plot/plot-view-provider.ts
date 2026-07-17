import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, MetadataRegistry, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { PlotViewComponent } from './plot-view.component';
import { isPlottable } from './plot-eligibility';

/**
 * Single-series and overlay plot view. Applies to overlay plots and to telemetry
 * with a numeric range (OMCT-C07-L2-01.01/01.02). Priority 90 so it wins over the
 * table view for a plottable object.
 */
export class PlotViewProvider implements ViewProvider {
  readonly key = 'plot-single';
  readonly name = 'Plot';
  readonly glyph = 'i-plot';
  readonly priority = 90;

  constructor(
    private readonly injector: EnvironmentInjector,
    private readonly metadata: MetadataRegistry,
  ) {}

  canView(object: DomainObject): boolean {
    return isPlottable(object, this.metadata);
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, PlotViewComponent, { object, objectPath });
  }
}
