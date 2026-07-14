import { EnvironmentInjector, inject } from '@angular/core';
import { ViewRegistry } from '@cupola/core';

import { FolderViewProvider } from './folder/folder-view-provider';
import { GenericViewProvider } from './generic/generic-view-provider';
import { ImageryViewProvider } from './imagery/imagery-view-provider';
import { PlotViewProvider } from './plot/plot-view-provider';
import { TableViewProvider } from './table/table-view-provider';

/** Registers the built-in object views. Called from an app initializer. */
export function registerDefaultViews(): void {
  const registry = inject(ViewRegistry);
  const injector = inject(EnvironmentInjector);

  registry.register(new PlotViewProvider(injector));
  registry.register(new ImageryViewProvider(injector));
  registry.register(new TableViewProvider(injector));
  registry.register(new FolderViewProvider(injector));
  registry.register(new GenericViewProvider(injector));
}
