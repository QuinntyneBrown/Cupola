import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { ImageryViewComponent } from './imagery-view.component';

/** Imagery view. Priority 80. */
export class ImageryViewProvider implements ViewProvider {
  readonly key = 'imagery';
  readonly name = 'Imagery';
  readonly glyph = 'i-image';
  readonly priority = 80;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'telemetry' && (object.telemetry?.hints.includes('image') ?? false);
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, ImageryViewComponent, { object });
  }
}
