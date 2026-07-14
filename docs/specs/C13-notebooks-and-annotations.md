# C13 — Notebooks and annotations

## OMCT-C13-L1-01 — Structured operational notebooks

Open MCT shall provide persistable notebooks organized into sections, pages, and timestamped
entries.

### OMCT-C13-L2-01.01 — Notebook creation

Open MCT shall provide creatable standard and restricted notebook types.

Acceptance criteria:

- **GIVEN** the applicable notebook plugin
- **WHEN** an operator opens the create menu
- **THEN** Open MCT shall offer the installed notebook type and initialize its section and
  page structure

Implementation evidence: `src/plugins/notebook/plugin.js`,
`src/plugins/notebook/pluginSpec.js`.

### OMCT-C13-L2-01.02 — Section and page editing

Open MCT shall add, rename, reorder, and delete notebook sections and pages.

Acceptance criteria:

- **GIVEN** an editable notebook
- **WHEN** the operator performs a supported section or page operation
- **THEN** Open MCT shall update and persist the notebook structure

Implementation evidence: `src/plugins/notebook/components/SectionCollection.vue`,
`src/plugins/notebook/components/PageCollection.vue`.

### OMCT-C13-L2-01.03 — Entry creation

Open MCT shall add an entry to the active notebook page with creation time and available
active-user identity.

Acceptance criteria:

- **GIVEN** an active notebook section and page
- **WHEN** the operator saves a new entry
- **THEN** Open MCT shall persist the entry with its identifier, timestamp, text, and active
  user when available

Implementation evidence: `src/plugins/notebook/utils/notebook-entries.js`,
`src/plugins/notebook/utils/notebook-entriesSpec.js`.

### OMCT-C13-L2-01.04 — Entry editing and deletion

Open MCT shall edit or delete an existing notebook entry.

Acceptance criteria:

- **GIVEN** a persisted entry in the active page
- **WHEN** the operator confirms an edit or deletion
- **THEN** Open MCT shall update or remove the identified entry

Implementation evidence: `src/plugins/notebook/components/NotebookEntry.vue`,
`src/plugins/notebook/utils/notebook-entries.js`.

### OMCT-C13-L2-01.05 — Default notebook location

Open MCT shall retain the default notebook, section, and page selection in browser storage.

Acceptance criteria:

- **GIVEN** a notebook selected as the default copy destination
- **WHEN** the application later resolves the default destination
- **THEN** Open MCT shall return the stored notebook, section, and page when they remain
  valid

Implementation evidence: `src/plugins/notebook/utils/notebook-storage.js`,
`src/plugins/notebook/utils/notebook-storageSpec.js`.

## OMCT-C13-L1-02 — Notebook capture, search, and export

Open MCT shall capture application context in notebook entries and make notebook content
discoverable and exportable.

### OMCT-C13-L2-02.01 — Copy to notebook

Open MCT shall copy compatible selected content into the default notebook destination.

Acceptance criteria:

- **GIVEN** a default notebook destination and compatible selected content
- **WHEN** the copy-to-notebook action runs
- **THEN** Open MCT shall create an entry containing the captured context

Implementation evidence: `src/plugins/notebook/actions/CopyToNotebookAction.js`,
`src/plugins/notebook/plugin.js`.

### OMCT-C13-L2-02.02 — Embedded snapshot

Open MCT shall store captured object-view context as a notebook snapshot.

Acceptance criteria:

- **GIVEN** a compatible object view and notebook entry
- **WHEN** a snapshot capture completes
- **THEN** Open MCT shall associate the captured view representation with the entry

Implementation evidence: `src/plugins/notebook/components/NotebookSnapshotContainer.vue`,
`src/plugins/notebook/components/NotebookEmbed.vue`.

### OMCT-C13-L2-02.03 — Snapshot browsing

Open MCT shall display and expand the snapshots associated with notebook entries.

Acceptance criteria:

- **GIVEN** a notebook containing snapshot entries
- **WHEN** the operator opens the snapshot container
- **THEN** Open MCT shall display the available snapshot content and expanded state

Implementation evidence: `src/plugins/notebook/components/NotebookSnapshotContainer.vue`,
`src/plugins/notebook/pluginSpec.js`.

### OMCT-C13-L2-02.04 — Notebook search

Open MCT shall search notebook entry text across its sections and pages.

Acceptance criteria:

- **GIVEN** a notebook with persisted entries
- **WHEN** the operator enters a search term
- **THEN** Open MCT shall display entries whose searchable content matches the term

Implementation evidence: `src/plugins/notebook/components/SearchResults.vue`,
`src/plugins/notebook/components/NotebookComponent.vue`.

### OMCT-C13-L2-02.05 — Text export

Open MCT shall export notebook structure and entries as text.

Acceptance criteria:

- **GIVEN** a populated notebook
- **WHEN** the export-notebook-as-text action runs
- **THEN** Open MCT shall download a text representation of its sections, pages, and entries

Implementation evidence: `src/plugins/notebook/actions/ExportNotebookAsTextAction.js`,
`src/plugins/notebook/plugin.js`.

### OMCT-C13-L2-02.06 — Restricted entry URLs

Open MCT shall allow embedded entry URLs in a restricted notebook only when they match its
configured whitelist.

Acceptance criteria:

- **GIVEN** a restricted notebook and proposed embedded URL
- **WHEN** the notebook renders the entry
- **THEN** Open MCT shall render only URLs permitted by the configured whitelist

Implementation evidence: `src/plugins/notebook/NotebookViewProvider.js`,
`src/plugins/notebook/plugin.js`,
`e2e/tests/functional/plugins/notebook/restrictedNotebook.e2e.spec.js`.

## OMCT-C13-L1-03 — Collaborative notebook synchronization

Open MCT shall reflect provider-originated notebook changes in an open notebook view.

### OMCT-C13-L2-03.01 — Remote entry update

Open MCT shall update a rendered entry when observation reports a remote modification.

Acceptance criteria:

- **GIVEN** an open notebook with an observed entry
- **WHEN** another client modifies that entry through the persistence provider
- **THEN** Open MCT shall update the rendered entry without reopening the notebook

Implementation evidence: `src/plugins/notebook/components/NotebookComponent.vue`,
`src/plugins/notebook/pluginSpec.js`.

### OMCT-C13-L2-03.02 — Remote entry addition

Open MCT shall add a rendered entry when observation reports a remote addition.

Acceptance criteria:

- **GIVEN** an open observed notebook page
- **WHEN** another client adds an entry
- **THEN** Open MCT shall display the new entry

Implementation evidence: `src/plugins/notebook/components/NotebookComponent.vue`,
`src/plugins/notebook/pluginSpec.js`.

### OMCT-C13-L2-03.03 — Remote entry removal

Open MCT shall remove a rendered entry when observation reports a remote deletion.

Acceptance criteria:

- **GIVEN** an open observed notebook page
- **WHEN** another client removes an entry
- **THEN** Open MCT shall remove that entry from the view

Implementation evidence: `src/plugins/notebook/components/NotebookComponent.vue`,
`src/plugins/notebook/pluginSpec.js`.

## OMCT-C13-L1-04 — General annotations and tags

Open MCT shall create, retrieve, categorize, and compare annotations linked to data
products.

### OMCT-C13-L2-04.01 — Annotation creation

Open MCT shall create a known annotation type in a mutable persistence namespace.

Acceptance criteria:

- **GIVEN** a supported annotation type, targets, and writable namespace
- **WHEN** annotation creation is requested
- **THEN** Open MCT shall persist the annotation and return it

Implementation evidence: `src/api/annotation/AnnotationAPI.js`,
`src/api/annotation/AnnotationAPISpec.js`.

### OMCT-C13-L2-04.02 — Immutable-target annotation

Open MCT shall annotate an immutable target by storing the annotation in a separate writable
namespace.

Acceptance criteria:

- **GIVEN** an immutable target and a writable annotation namespace
- **WHEN** annotation creation is requested
- **THEN** Open MCT shall persist the annotation without mutating the target

Implementation evidence: `src/api/annotation/AnnotationAPI.js`,
`src/api/annotation/AnnotationAPISpec.js`.

### OMCT-C13-L2-04.03 — Annotation validation

Open MCT shall reject an unknown annotation type or an unavailable or immutable annotation
namespace.

Acceptance criteria:

- **GIVEN** an invalid type or invalid persistence namespace
- **WHEN** annotation creation is requested
- **THEN** Open MCT shall reject the request without creating an annotation

Implementation evidence: `src/api/annotation/AnnotationAPI.js`,
`src/api/annotation/AnnotationAPISpec.js`.

### OMCT-C13-L2-04.04 — Tag lifecycle

Open MCT shall add, delete, clear, and list annotation tags.

Acceptance criteria:

- **GIVEN** annotation tag configuration
- **WHEN** an extension performs a supported tag operation
- **THEN** Open MCT shall return the updated available-tag set

Implementation evidence: `src/api/annotation/AnnotationAPI.js`,
`src/api/annotation/AnnotationAPISpec.js`.

### OMCT-C13-L2-04.05 — Tag search

Open MCT shall find tags that match a nonempty search term.

Acceptance criteria:

- **GIVEN** configured annotation tags
- **WHEN** an extension searches with a nonempty or empty term
- **THEN** Open MCT shall return matching tags for the nonempty term and no tags for the
  empty term

Implementation evidence: `src/api/annotation/AnnotationAPI.js`,
`src/api/annotation/AnnotationAPISpec.js`.

### OMCT-C13-L2-04.06 — Annotation target comparison

Open MCT shall compare annotation targets with a registered comparator or deep equality as
fallback.

Acceptance criteria:

- **GIVEN** two annotation targets
- **WHEN** target comparison runs
- **THEN** Open MCT shall use an applicable registered comparator or fall back to deep
  equality

Implementation evidence: `src/api/annotation/AnnotationAPI.js`,
`src/api/annotation/AnnotationAPISpec.js`.

