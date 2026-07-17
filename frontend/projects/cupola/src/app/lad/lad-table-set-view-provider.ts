import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { LadTableSetViewComponent } from './lad-table-set-view.component';

/** LAD table set view for `lad-table-set` objects (OMCT-C08-L2-02.03). */
export class LadTableSetViewProvider implements ViewProvider {
  readonly key = 'lad-table-set';
  readonly name = 'LAD Table Set';
  readonly glyph = 'i-list';
  readonly priority = 80;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'lad-table-set';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, LadTableSetViewComponent, { object, objectPath });
  }
}
