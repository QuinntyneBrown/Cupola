import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { PlanMonitoringViewComponent } from './plan-monitoring-view.component';

/**
 * Plan execution-monitoring inspector for a selected plan (OMCT-C12-L2-04.04).
 * Applies when the selected object is a plan — directly, or via a selected
 * activity whose context carries its plan.
 */
export class PlanMonitoringViewProvider implements InspectorViewProvider {
  readonly key = 'plan-monitoring';
  readonly name = 'Plan Monitoring';
  readonly glyph = 'i-timeline';
  readonly priority = 60;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    return selection[0]?.context.object?.type === 'plan';
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.injector, PlanMonitoringViewComponent, { selection });
  }
}
