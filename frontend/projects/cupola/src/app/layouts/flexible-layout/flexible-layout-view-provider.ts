import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { FlexibleLayoutViewComponent } from './flexible-layout-view.component';

/** Flexible-layout pane view (OMCT-C09-L2-02.01). */
export class FlexibleLayoutViewProvider implements ViewProvider {
  readonly key = 'flexible-layout';
  readonly name = 'Flexible Layout';
  readonly glyph = 'i-columns';
  readonly priority = 100;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'flexible-layout';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.environmentInjector, FlexibleLayoutViewComponent, {
      object,
      objectPath,
    });
  }
}
