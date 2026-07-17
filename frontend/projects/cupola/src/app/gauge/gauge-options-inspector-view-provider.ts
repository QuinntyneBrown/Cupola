import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { GaugeOptionsInspectorComponent } from './gauge-options-inspector.component';

/** Gauge options inspector view provider (OMCT-C08-L2-03.01/03.03). */
export class GaugeOptionsInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'gauge-options';
  readonly name = 'Gauge';
  readonly glyph = 'i-gauge';
  readonly priority = 75;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    const object: DomainObject | undefined = selection[0]?.context.object;
    return object?.type === 'gauge';
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.injector, GaugeOptionsInspectorComponent, { selection });
  }
}
