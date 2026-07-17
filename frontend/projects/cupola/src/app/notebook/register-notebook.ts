import { DOCUMENT, EnvironmentInjector, inject } from '@angular/core';
import {
  ActionRegistry,
  AnnotationService,
  DomainObject,
  NotebookService,
  NotebookStorageService,
  NotificationService,
  TypeRegistry,
  ViewRegistry,
  deepEqual,
  makeSection,
} from '@cupola/core';

import { CopyToNotebookAction } from './actions/copy-to-notebook-action';
import { ExportNotebookAsTextAction } from './actions/export-notebook-as-text-action';
import { NotebookViewProvider } from './notebook-view-provider';
import { RESTRICTED_NOTEBOOK_URL_WHITELIST } from './restricted-url-policy';
import { SnapshotCaptureService } from './snapshot/snapshot-capture.service';

/** Seeds a newly created notebook with one section and page (OMCT-C13-L2-01.01). */
function initializeNotebook(object: DomainObject, restricted: boolean): void {
  object.configuration = {
    ...object.configuration,
    sections: [makeSection('Section 1')],
    entries: {},
    ...(restricted
      ? { isRestricted: true, urlWhitelist: [...RESTRICTED_NOTEBOOK_URL_WHITELIST] }
      : {}),
  };
}

/**
 * Registers C13 notebook and annotation contributions: the notebook,
 * restricted-notebook, and annotation object types (notebooks seed their
 * section/page structure on creation); the notebook view provider; the
 * copy-to-notebook and export-as-text actions; and the known annotation types
 * and default target comparators. Must run inside an injection context (the app
 * initializer), before create actions are minted from the creatable types.
 *
 * Requirements: OMCT-C13-L2-01.01, 02.01, 02.05, 04.01, 04.06.
 */
export function registerNotebook(): void {
  const types = inject(TypeRegistry);
  types.register({
    key: 'notebook',
    name: 'Notebook',
    glyph: 'i-notebook',
    description: 'A timestamped log for operator notes and annotations.',
    creatable: true,
    initialize: (object) => initializeNotebook(object, false),
  });
  types.register({
    key: 'restricted-notebook',
    name: 'Restricted Notebook',
    glyph: 'i-notebook',
    description: 'A notebook with committed entries and a restricted URL whitelist.',
    creatable: true,
    initialize: (object) => initializeNotebook(object, true),
  });
  types.register({
    key: 'annotation',
    name: 'Annotation',
    glyph: 'i-flag',
    description: 'Tags and comments linked to points, regions, or objects.',
    creatable: false,
  });

  const injector = inject(EnvironmentInjector);
  inject(ViewRegistry).register(new NotebookViewProvider(injector));

  const registry = inject(ActionRegistry);
  registry.register(
    new CopyToNotebookAction(
      inject(NotebookStorageService),
      inject(NotebookService),
      inject(SnapshotCaptureService),
      inject(NotificationService),
    ),
  );
  registry.register(new ExportNotebookAsTextAction(inject(NotebookService), inject(DOCUMENT)));

  // Known annotation types and default target comparators (OMCT-C13-L2-04.01/04.06).
  const annotations = inject(AnnotationService);
  for (const annotationType of ['tag', 'notebook', 'plot-spatial', 'temporal']) {
    annotations.registerType(annotationType);
  }
  // Temporal annotations match by target object regardless of the sampled range;
  // every other type falls back to deep equality.
  annotations.registerComparator('temporal', (a, b) => a.keyString === b.keyString);
  annotations.registerComparator('plot-spatial', (a, b) => deepEqual(a, b));
}
