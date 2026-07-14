import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { GenericViewComponent } from './generic-view.component';

/** Fallback properties view — applies to everything. Priority -1. */
export class GenericViewProvider implements ViewProvider {
  readonly key = 'generic';
  readonly name = 'Properties';
  readonly glyph = 'i-info';
  readonly priority = -1;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(): boolean {
    return true;
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, GenericViewComponent, { object });
  }
}
