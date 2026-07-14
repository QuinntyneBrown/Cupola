import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { StylesInspectorViewComponent } from './styles-inspector-view.component';

/** Styles inspector view — for plot and layout objects. */
export class StylesInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'styles';
  readonly name = 'Styles';
  readonly glyph = 'i-eye';
  readonly priority = 60;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    const type = selection[0]?.context.object?.type;
    return type === 'overlay-plot' || type === 'layout';
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, StylesInspectorViewComponent, { selection });
  }
}
