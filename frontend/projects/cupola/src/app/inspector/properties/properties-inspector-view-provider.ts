import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { PropertiesInspectorViewComponent } from './properties-inspector-view.component';

/** Properties inspector view — always applicable. */
export class PropertiesInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'properties';
  readonly name = 'Properties';
  readonly glyph = 'i-info';
  readonly priority = 100;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    return selection.length > 0;
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, PropertiesInspectorViewComponent, { selection });
  }
}
