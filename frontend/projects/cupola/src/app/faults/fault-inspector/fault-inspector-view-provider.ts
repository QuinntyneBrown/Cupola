import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { FaultInspectorComponent } from './fault-inspector.component';

/** Fault inspector view for fault selections. Requirement: OMCT-C14-L2-03.02. */
export class FaultInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'fault-inspector';
  readonly name = 'Fault';
  readonly glyph = 'i-alert-triangle';
  readonly priority = 90;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    return selection.some((item) => item.context.type === 'fault');
  }

  view(): CupolaView {
    return componentView(this.environmentInjector, FaultInspectorComponent);
  }
}
