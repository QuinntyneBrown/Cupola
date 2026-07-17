import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { AutoflowViewComponent } from './autoflow-view.component';

/** Autoflow tabular view for `autoflow` objects (OMCT-C08-L1-04). */
export class AutoflowViewProvider implements ViewProvider {
  readonly key = 'autoflow';
  readonly name = 'Autoflow';
  readonly glyph = 'i-list';
  readonly priority = 80;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'autoflow';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, AutoflowViewComponent, { object, objectPath });
  }
}
