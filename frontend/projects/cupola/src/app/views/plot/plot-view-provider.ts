import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { PlotViewComponent } from './plot-view.component';

/** Single/overlay plot view. Priority 90. */
export class PlotViewProvider implements ViewProvider {
  readonly key = 'plot-single';
  readonly name = 'Plot';
  readonly glyph = 'i-plot';
  readonly priority = 90;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return (
      object.type === 'overlay-plot' ||
      (object.type === 'telemetry' && (object.telemetry?.hints.includes('range') ?? false))
    );
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, PlotViewComponent, { object });
  }
}
