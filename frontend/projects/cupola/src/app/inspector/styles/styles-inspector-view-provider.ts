import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { StylesInspectorViewComponent } from './styles-inspector-view.component';

/** Types whose objects can carry conditional styles. */
const STYLABLE_TYPES = new Set([
  'overlay-plot',
  'layout',
  'flexible-layout',
  'condition-set',
  'condition-widget',
  'summary-widget',
]);

/** Styles inspector view — for plot, layout, and condition-driven objects. */
export class StylesInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'styles';
  readonly name = 'Styles';
  readonly glyph = 'i-eye';
  readonly priority = 60;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    const type = selection[0]?.context.object?.type;
    return type !== undefined && STYLABLE_TYPES.has(type);
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, StylesInspectorViewComponent, { selection });
  }
}
