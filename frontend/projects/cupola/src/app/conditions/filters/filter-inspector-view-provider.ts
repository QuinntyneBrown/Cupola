import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { FilterInspectorViewComponent } from './filter-inspector-view.component';

/** Types whose views expose composed telemetry that can carry filters. */
const FILTERABLE_VIEW_TYPES = new Set(['condition-set', 'summary-widget', 'overlay-plot']);

/** Filter inspector — for telemetry objects and filterable composite views. */
export class FilterInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'filters';
  readonly name = 'Filters';
  readonly glyph = 'i-filter';
  readonly priority = 50;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    const object = selection[0]?.context.object;
    if (!object) {
      return false;
    }
    return (object.telemetry?.filters?.length ?? 0) > 0 || FILTERABLE_VIEW_TYPES.has(object.type);
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, FilterInspectorViewComponent, { selection });
  }
}
