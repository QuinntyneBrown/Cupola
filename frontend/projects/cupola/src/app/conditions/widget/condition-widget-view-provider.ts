import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { ConditionWidgetViewComponent } from './condition-widget-view.component';

/** Condition widget view. Priority 90. */
export class ConditionWidgetViewProvider implements ViewProvider {
  readonly key = 'condition-widget';
  readonly name = 'Condition Widget';
  readonly glyph = 'i-alert-circle';
  readonly priority = 90;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'condition-widget';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, ConditionWidgetViewComponent, { object });
  }
}
