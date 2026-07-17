import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { TabsViewComponent } from './tabs-view.component';

/** Tabs view — one tab per composed child (OMCT-C09-L2-03.01). */
export class TabsViewProvider implements ViewProvider {
  readonly key = 'tabs';
  readonly name = 'Tabs';
  readonly glyph = 'i-tabs';
  readonly priority = 100;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'tabs';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.environmentInjector, TabsViewComponent, { object, objectPath });
  }
}
