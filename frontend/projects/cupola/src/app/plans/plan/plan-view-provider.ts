import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { PlanViewComponent } from './plan-view.component';

/**
 * Plan view provider. Applies to `plan` objects (OMCT-C12-L2-01.02). Priority 85
 * so the plan view wins over any generic fallback for a plan object.
 */
export class PlanViewProvider implements ViewProvider {
  readonly key = 'plan-view';
  readonly name = 'Plan';
  readonly glyph = 'i-timeline';
  readonly priority = 85;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'plan';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, PlanViewComponent, { object, objectPath });
  }
}
