import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { WebPageViewComponent } from './web-page-view.component';

/** Web-page embed view (OMCT-C09-L2-04.03). */
export class WebPageViewProvider implements ViewProvider {
  readonly key = 'web-page';
  readonly name = 'Web Page';
  readonly glyph = 'i-link';
  readonly priority = 100;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'web-page';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, WebPageViewComponent, { object });
  }
}
