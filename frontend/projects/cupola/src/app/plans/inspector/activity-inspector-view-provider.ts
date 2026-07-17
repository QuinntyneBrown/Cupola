import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { ActivityInspectorViewComponent } from './activity-inspector-view.component';
import { isPlanActivitySelection } from './activity-selection';

/** Activity inspector for a selected plan activity (OMCT-C12-L2-01.04). */
export class ActivityInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'activity-inspector';
  readonly name = 'Activity';
  readonly glyph = 'i-timeline';
  readonly priority = 95;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    return isPlanActivitySelection(selection[0]?.context);
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.injector, ActivityInspectorViewComponent, { selection });
  }
}
