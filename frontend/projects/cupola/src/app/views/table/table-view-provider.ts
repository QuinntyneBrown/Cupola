import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { TableViewComponent } from './table-view.component';

/** Tabular telemetry view. Priority 60. */
export class TableViewProvider implements ViewProvider {
  readonly key = 'table';
  readonly name = 'Table';
  readonly glyph = 'i-table';
  readonly priority = 60;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return (
      object.type === 'overlay-plot' ||
      (object.type === 'telemetry' && (object.telemetry?.hints.includes('range') ?? false))
    );
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, TableViewComponent, { object });
  }
}
