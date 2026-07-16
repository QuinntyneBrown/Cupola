import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { FaultListComponent } from './fault-list.component';

/** Fault list view for the fault-management root. Requirement: OMCT-C14-L2-03.02. */
export class FaultListViewProvider implements ViewProvider {
  readonly key = 'fault-list';
  readonly name = 'Faults';
  readonly glyph = 'i-alert-triangle';
  readonly priority = 100;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'fault-management';
  }

  view(): CupolaView {
    return componentView(this.environmentInjector, FaultListComponent);
  }
}
