import { EnvironmentInjector, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionRegistry,
  CompositionApi,
  ObjectApi,
  ObjectUpdatesService,
  TransactionManager,
  TypeRegistry,
} from '@cupola/core';
import { FormsService, OverlayService } from '@cupola/components';

import { ClearDataAction } from './clear-data/clear-data-action';
import { ClearDataService } from './clear-data/clear-data.service';
import { CreateAction } from './create/create-action';
import { DuplicateAction } from './duplicate/duplicate-action';
import { EditPropertiesAction } from './edit-properties/edit-properties-action';
import { ExportAsJsonAction } from './export/export-as-json-action';
import { JsonExportService } from './export/json-export.service';
import { GoToOriginalAction } from './go-to-original/go-to-original-action';
import { ImportFromJsonAction } from './import/import-from-json-action';
import { JsonImportService } from './import/json-import.service';
import { LinkAction } from './link/link-action';
import { MoveAction } from './move/move-action';
import { OpenAction } from './open/open-action';
import { OpenInNewTabAction } from './open-in-new-tab/open-in-new-tab-action';
import { PreviewService } from './view-large/preview.service';
import { ReloadAction } from './reload/reload-action';
import { RemoveAction } from './remove/remove-action';
import { ViewAsTableAction } from './view-as-table/view-as-table-action';
import { ViewLargeAction } from './view-large/view-large-action';

/** Registers the built-in actions. Called from an app initializer. */
export function registerDefaultActions(): void {
  const registry = inject(ActionRegistry);
  const overlays = inject(OverlayService);
  const forms = inject(FormsService);
  const preview = inject(PreviewService);
  const router = inject(Router);
  const injector = inject(EnvironmentInjector);
  const objects = inject(ObjectApi);
  const composition = inject(CompositionApi);
  const types = inject(TypeRegistry);
  const transactions = inject(TransactionManager);
  const updates = inject(ObjectUpdatesService);
  const exportService = inject(JsonExportService);
  const importService = inject(JsonImportService);
  const clearData = inject(ClearDataService);

  registry.register(new OpenAction(router));
  registry.register(new OpenInNewTabAction());
  registry.register(new ViewAsTableAction(router));
  registry.register(new EditPropertiesAction(forms, transactions, updates));
  registry.register(new ViewLargeAction(overlays, preview, injector));

  // C03 creation: one create action per registered creatable type (sourced from
  // C02's TypeRegistry rather than a hardcoded list).
  for (const type of types.listCreatable()) {
    registry.register(new CreateAction(type, forms, objects, composition));
  }

  // C03 hierarchy, portability, and data-control actions.
  registry.register(new DuplicateAction(forms, objects, composition));
  registry.register(new LinkAction(forms, objects, composition));
  registry.register(new MoveAction(forms, objects, composition));
  registry.register(new RemoveAction(transactions, updates));
  registry.register(new ExportAsJsonAction(exportService));
  registry.register(new ImportFromJsonAction(importService));
  registry.register(new GoToOriginalAction(objects, router));
  registry.register(new ReloadAction(objects, updates));
  registry.register(new ClearDataAction(clearData));
}
