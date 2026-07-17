import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { DerivedViewComponent } from './derived-view.component';

/** Derived-telemetry latest-value view. Priority 80. */
export class DerivedViewProvider implements ViewProvider {
  readonly key = 'derived-telemetry';
  readonly name = 'Derived Value';
  readonly glyph = 'i-plot';
  readonly priority = 80;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'derived-telemetry';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, DerivedViewComponent, { object });
  }
}
