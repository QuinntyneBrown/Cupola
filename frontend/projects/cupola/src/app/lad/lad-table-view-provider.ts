import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { LadTableViewComponent } from './lad-table-view.component';

/** Latest-available-data table view for `lad-table` objects (OMCT-C08-L2-02.02). */
export class LadTableViewProvider implements ViewProvider {
  readonly key = 'lad-table';
  readonly name = 'LAD Table';
  readonly glyph = 'i-list';
  readonly priority = 80;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'lad-table';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, LadTableViewComponent, { object, objectPath });
  }
}
