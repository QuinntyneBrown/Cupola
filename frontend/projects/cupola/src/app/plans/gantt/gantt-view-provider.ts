import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { GanttViewComponent } from './gantt-view.component';

/** Gantt chart view provider. Applies to `gantt-chart` objects (OMCT-C12-L2-01.05). */
export class GanttViewProvider implements ViewProvider {
  readonly key = 'gantt-chart';
  readonly name = 'Gantt Chart';
  readonly glyph = 'i-timeline';
  readonly priority = 85;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'gantt-chart';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, GanttViewComponent, { object, objectPath });
  }
}
