import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { DisplayLayoutViewComponent } from './display-layout-view.component';

/** Display-layout canvas view (OMCT-C09-L2-01.01). */
export class DisplayLayoutViewProvider implements ViewProvider {
  readonly key = 'layout';
  readonly name = 'Display Layout';
  readonly glyph = 'i-layout';
  readonly priority = 100;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'layout';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.environmentInjector, DisplayLayoutViewComponent, {
      object,
      objectPath,
    });
  }
}
