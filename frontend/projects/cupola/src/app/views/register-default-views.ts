import { EnvironmentInjector, inject } from '@angular/core';
import { ViewRegistry } from '@cupola/core';

import { FolderViewProvider } from './folder/folder-view-provider';
import { GenericViewProvider } from './generic/generic-view-provider';
import { TableViewProvider } from './table/table-view-provider';

/**
 * Registers the built-in object views. Called from an app initializer. The plot
 * and chart view providers register separately in {@link registerPlotViews}
 * (C07); the imagery provider registers in {@link registerImagery} (C11).
 */
export function registerDefaultViews(): void {
  const registry = inject(ViewRegistry);
  const injector = inject(EnvironmentInjector);

  registry.register(new TableViewProvider(injector));
  registry.register(new FolderViewProvider(injector));
  registry.register(new GenericViewProvider(injector));
}
