import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { HyperlinkViewComponent } from './hyperlink-view.component';

/** Hyperlink view — link or button presentation (OMCT-C09-L2-04.01). */
export class HyperlinkViewProvider implements ViewProvider {
  readonly key = 'hyperlink';
  readonly name = 'Hyperlink';
  readonly glyph = 'i-link';
  readonly priority = 100;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'hyperlink';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, HyperlinkViewComponent, { object });
  }
}
