import { EnvironmentInjector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActionRegistry, ObjectPersistenceService } from '@cupola/core';
import { FormsService, OverlayService } from '@cupola/components';

import { EditPropertiesAction } from './edit-properties/edit-properties-action';
import { OpenAction } from './open/open-action';
import { PreviewService } from './view-large/preview.service';
import { ViewAsTableAction } from './view-as-table/view-as-table-action';
import { ViewLargeAction } from './view-large/view-large-action';

/** Registers the built-in actions. Called from an app initializer. */
export function registerDefaultActions(): void {
  const registry = inject(ActionRegistry);
  const overlays = inject(OverlayService);
  const forms = inject(FormsService);
  const preview = inject(PreviewService);
  const persistence = inject(ObjectPersistenceService);
  const router = inject(Router);
  const injector = inject(EnvironmentInjector);

  registry.register(new OpenAction(router));
  registry.register(new ViewAsTableAction(router));
  registry.register(new EditPropertiesAction(forms, persistence));
  registry.register(new ViewLargeAction(overlays, preview, injector));
}
