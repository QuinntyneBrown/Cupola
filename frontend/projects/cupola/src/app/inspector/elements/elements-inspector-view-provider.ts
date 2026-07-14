import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { ElementsInspectorViewComponent } from './elements-inspector-view.component';

/** Elements inspector view — for selections that have composition. */
export class ElementsInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'elements';
  readonly name = 'Elements';
  readonly glyph = 'i-layers';
  readonly priority = 80;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    const object = selection[0]?.context.object;
    return !!object && object.composition.length > 0;
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, ElementsInspectorViewComponent, { selection });
  }
}
