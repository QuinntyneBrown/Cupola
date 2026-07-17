import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { FolderListViewComponent } from './folder-list-view.component';

/** Folder view — child object list (OMCT-C09-L2-03.04). Priority 49, below Grid. */
export class FolderListViewProvider implements ViewProvider {
  readonly key = 'list';
  readonly name = 'List';
  readonly glyph = 'i-list';
  readonly priority = 49;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'folder' || object.type === 'root';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, FolderListViewComponent, { object });
  }
}
