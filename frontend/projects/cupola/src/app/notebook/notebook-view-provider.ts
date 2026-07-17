import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { NotebookViewComponent } from './notebook-view.component';

/** Object-view provider for standard and restricted notebooks (OMCT-C13-L1-01). */
export class NotebookViewProvider implements ViewProvider {
  readonly key = 'notebook-view';
  readonly name = 'Notebook';
  readonly glyph = 'i-notebook';
  readonly priority = 85;

  constructor(private readonly injector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'notebook' || object.type === 'restricted-notebook';
  }

  view(object: DomainObject, objectPath: DomainObject[]): CupolaView {
    return componentView(this.injector, NotebookViewComponent, { object, objectPath });
  }
}
