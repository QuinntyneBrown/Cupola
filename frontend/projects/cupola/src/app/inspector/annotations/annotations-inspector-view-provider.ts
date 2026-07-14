import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { AnnotationsInspectorViewComponent } from './annotations-inspector-view.component';

/** Annotations inspector view — always applicable. */
export class AnnotationsInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'annotations';
  readonly name = 'Annotations';
  readonly glyph = 'i-flag';
  readonly priority = 40;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    return selection.length > 0;
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, AnnotationsInspectorViewComponent, { selection });
  }
}
