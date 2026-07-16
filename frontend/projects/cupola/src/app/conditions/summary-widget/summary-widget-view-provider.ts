import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { SummaryWidgetViewComponent } from './summary-widget-view.component';

/** Summary widget view. Priority 90. */
export class SummaryWidgetViewProvider implements ViewProvider {
  readonly key = 'summary-widget';
  readonly name = 'Summary Widget';
  readonly glyph = 'i-alert-triangle';
  readonly priority = 90;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'summary-widget';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, SummaryWidgetViewComponent, { object });
  }
}
