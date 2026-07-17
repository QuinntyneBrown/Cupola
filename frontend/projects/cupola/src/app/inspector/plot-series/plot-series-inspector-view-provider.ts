import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { PlotSeriesInspectorViewComponent } from './plot-series-inspector-view.component';

const SERIES_TYPES = new Set(['overlay-plot', 'stacked-plot', 'bar-graph', 'scatter-plot']);

/** Plot-series inspector — series styles and plot/chart options (OMCT-C07-L2-04.05). */
export class PlotSeriesInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'plot-series';
  readonly name = 'Plot Series';
  readonly glyph = 'i-plot';
  readonly priority = 70;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    const object: DomainObject | undefined = selection[0]?.context.object;
    if (!object) {
      return false;
    }
    return (
      SERIES_TYPES.has(object.type) ||
      (object.type === 'telemetry' && (object.telemetry?.hints?.includes('range') ?? false))
    );
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, PlotSeriesInspectorViewComponent, { selection });
  }
}
