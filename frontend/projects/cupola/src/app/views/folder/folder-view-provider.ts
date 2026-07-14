import { EnvironmentInjector } from '@angular/core';
import { CupolaView, DomainObject, ViewProvider } from '@cupola/core';
import { componentView } from '@cupola/components';

import { FolderViewComponent } from './folder-view.component';

/** Folder view — child object grid. Priority 50. */
export class FolderViewProvider implements ViewProvider {
  readonly key = 'folder';
  readonly name = 'Grid';
  readonly glyph = 'i-folder';
  readonly priority = 50;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(object: DomainObject): boolean {
    return object.type === 'folder' || object.type === 'root';
  }

  view(object: DomainObject): CupolaView {
    return componentView(this.environmentInjector, FolderViewComponent, { object });
  }
}
