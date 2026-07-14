import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { PlotSeriesInspectorViewComponent } from './plot-series-inspector-view.component';

/** Plot-series inspector view — Cupola equivalent of plot elements. */
export class PlotSeriesInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'plot-series';
  readonly name = 'Plot Series';
  readonly glyph = 'i-plot';
  readonly priority = 70;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    return selection[0]?.context.object?.type === 'overlay-plot';
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, PlotSeriesInspectorViewComponent, { selection });
  }
}
