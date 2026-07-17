import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { TimeStripViewComponent } from './time-strip-view.component';

/** Time strip view provider. Applies to `time-strip` objects (OMCT-C12-L1-02). */
export class TimeStripViewProvider implements ViewProvider {
  readonly key = 'time-strip';
  readonly name = 'Time Strip';
  readonly glyph = 'i-timeline';
  readonly priority = 85;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'time-strip';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, TimeStripViewComponent, { object, objectPath });
  }
}
