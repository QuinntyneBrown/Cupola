import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { ConditionSetViewComponent } from './condition-set-view.component';

/** Condition-set editor and live view. Priority 90. */
export class ConditionSetViewProvider implements ViewProvider {
  readonly key = 'condition-set';
  readonly name = 'Condition Set';
  readonly glyph = 'i-alert-circle';
  readonly priority = 90;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'condition-set';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, ConditionSetViewComponent, { object });
  }
}
