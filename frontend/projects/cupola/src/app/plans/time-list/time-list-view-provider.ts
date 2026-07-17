import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { TimeListViewComponent } from './time-list-view.component';

/** Time list view provider. Applies to `time-list` objects (OMCT-C12-L1-03). */
export class TimeListViewProvider implements ViewProvider {
  readonly key = 'time-list';
  readonly name = 'Time List';
  readonly glyph = 'i-list';
  readonly priority = 85;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'time-list';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, TimeListViewComponent, { object, objectPath });
  }
}
