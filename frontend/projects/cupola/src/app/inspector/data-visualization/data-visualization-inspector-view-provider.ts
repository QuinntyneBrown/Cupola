import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { DataVisualizationInspectorViewComponent } from './data-visualization-inspector-view.component';

/**
 * Data-visualization inspector view — applies to telemetry selections,
 * rendering a numeric or imagery visualization by hints.
 * Requirement: OMCT-C15-L2-02.05.
 */
export class DataVisualizationInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'data-visualization';
  readonly name = 'Data';
  readonly glyph = 'i-activity';
  readonly priority = 50;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    return selection[0]?.context.object?.type === 'telemetry';
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, DataVisualizationInspectorViewComponent, {
      selection,
    });
  }
}
