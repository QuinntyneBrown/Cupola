# C03 — Object authoring and data portability

## OMCT-C03-L1-01 — Object creation and property editing

Open MCT shall provide transactional workflows for creating and editing persistable domain
objects.

### OMCT-C03-L2-01.01 — Type-based creation

Open MCT shall create a new object from a registered creatable type and a selected parent.

Acceptance criteria:

- **GIVEN** a creatable type and a persistable parent that accepts the type
- **WHEN** the create action receives valid form values
- **THEN** Open MCT shall persist the new object and add it to the parent composition

Implementation evidence: `src/plugins/formActions/CreateAction.js`,
`src/plugins/formActions/CreateActionSpec.js`.

### OMCT-C03-L2-01.02 — Edit applicability

Open MCT shall offer property editing only for persistable objects with editable
properties.

Acceptance criteria:

- **GIVEN** a selected domain object
- **WHEN** action applicability is evaluated
- **THEN** Open MCT shall expose the edit-properties action only when the object can be
  persisted and edited

Implementation evidence: `src/plugins/formActions/EditPropertiesAction.js`,
`src/plugins/formActions/pluginSpec.js`.

### OMCT-C03-L2-01.03 — Save edited properties

Open MCT shall commit valid property changes made through the edit form.

Acceptance criteria:

- **GIVEN** an edit form containing changed valid properties
- **WHEN** the operator confirms the form
- **THEN** Open MCT shall save the changed object and close the editing transaction

Implementation evidence: `src/plugins/formActions/EditPropertiesAction.js`,
`src/api/Editor.js`, `src/api/EditorSpec.js`.

### OMCT-C03-L2-01.04 — Discard edited properties

Open MCT shall restore the pre-edit state when property editing is cancelled.

Acceptance criteria:

- **GIVEN** an edit form with unsaved changes
- **WHEN** the operator cancels the form
- **THEN** Open MCT shall discard the transaction changes without persisting them

Implementation evidence: `src/plugins/formActions/EditPropertiesAction.js`,
`src/plugins/formActions/pluginSpec.js`.

### OMCT-C03-L2-01.05 — Failed-save retention

Open MCT shall keep an editing transaction open when save fails.

Acceptance criteria:

- **GIVEN** an active edit transaction
- **WHEN** its persistence provider rejects save
- **THEN** Open MCT shall retain the transaction for correction or cancellation

Implementation evidence: `src/api/Editor.js`, `src/api/EditorSpec.js`.

## OMCT-C03-L1-02 — Hierarchy editing actions

Open MCT shall provide controlled actions for creating, copying, linking, moving, and
removing hierarchy content.

### OMCT-C03-L2-02.01 — Folder creation

Open MCT shall create a folder within an eligible parent composition.

Acceptance criteria:

- **GIVEN** a persistable parent that accepts folder children
- **WHEN** the new-folder action completes
- **THEN** Open MCT shall persist a folder and add its identifier to the parent composition

Implementation evidence: `src/plugins/newFolderAction/plugin.js`,
`src/plugins/newFolderAction/pluginSpec.js`.

### OMCT-C03-L2-02.02 — Object duplication

Open MCT shall duplicate an eligible object with a new identifier.

Acceptance criteria:

- **GIVEN** an eligible source object and destination parent
- **WHEN** the duplicate action completes
- **THEN** Open MCT shall create a distinct object that preserves the source name unless a
  replacement name was supplied

Implementation evidence: `src/plugins/duplicate/DuplicateAction.js`,
`src/plugins/duplicate/pluginSpec.js`.

### OMCT-C03-L2-02.03 — Object linking

Open MCT shall add an alias to a new parent without removing the original membership.

Acceptance criteria:

- **GIVEN** an eligible source object and a different eligible parent
- **WHEN** the link action completes
- **THEN** Open MCT shall add an alias to the new parent while retaining the source in its
  original parent

Implementation evidence: `src/plugins/linkAction/LinkAction.js`,
`src/plugins/linkAction/pluginSpec.js`.

### OMCT-C03-L2-02.04 — Object move

Open MCT shall transfer eligible hierarchy membership from one parent to another.

Acceptance criteria:

- **GIVEN** a child, its current parent, and an eligible destination parent
- **WHEN** the move action completes
- **THEN** Open MCT shall add the child to the destination and remove it from the current
  parent

Implementation evidence: `src/plugins/move/MoveAction.js`, `src/plugins/move/pluginSpec.js`.

### OMCT-C03-L2-02.05 — Composition removal

Open MCT shall remove eligible membership within an object transaction.

Acceptance criteria:

- **GIVEN** a removable child in a mutable parent composition
- **WHEN** the remove action completes
- **THEN** Open MCT shall remove the child from the parent and close the transaction

Implementation evidence: `src/plugins/remove/RemoveAction.js`,
`src/plugins/remove/pluginSpec.js`.

### OMCT-C03-L2-02.06 — Locked-object action policy

Open MCT shall prevent direct removal of a locked original while allowing permitted alias
and move workflows.

Acceptance criteria:

- **GIVEN** a locked selected object
- **WHEN** hierarchy-action applicability is evaluated
- **THEN** Open MCT shall apply the locked-object and alias rules implemented by the move
  and remove actions

Implementation evidence: `src/plugins/move/MoveAction.js`, `src/plugins/remove/RemoveAction.js`,
`src/plugins/move/pluginSpec.js`, `src/plugins/remove/pluginSpec.js`.

## OMCT-C03-L1-03 — JSON data portability

Open MCT shall import and export persistable object trees as JavaScript Object Notation
(JSON) data while preserving referential integrity.

### OMCT-C03-L2-03.01 — Recursive export

Open MCT shall export an eligible object and its creatable descendants.

Acceptance criteria:

- **GIVEN** a persistable object with composed descendants
- **WHEN** the export-as-JSON action runs
- **THEN** Open MCT shall serialize the eligible object tree and skip non-creatable
  descendants

Implementation evidence: `src/plugins/exportAsJSONAction/ExportAsJSONAction.js`,
`src/plugins/exportAsJSONAction/ExportAsJSONActionSpec.js`.

### OMCT-C03-L2-03.02 — Cyclic export

Open MCT shall terminate export of self-containing or cyclic compositions.

Acceptance criteria:

- **GIVEN** an object tree containing a repeated object reference
- **WHEN** JSON export traverses the tree
- **THEN** Open MCT shall produce an export without recursive nontermination

Implementation evidence: `src/exporters/JSONExporter.js`,
`src/plugins/exportAsJSONAction/ExportAsJSONActionSpec.js`.

### OMCT-C03-L2-03.03 — External-reference export

Open MCT shall preserve references to objects outside an exported tree as importable
objects.

Acceptance criteria:

- **GIVEN** an exported object that links to an external object
- **WHEN** export serializes that relationship
- **THEN** Open MCT shall include a representation that can recreate the external link

Implementation evidence: `src/exporters/JSONExporter.js`,
`src/plugins/exportAsJSONAction/ExportAsJSONActionSpec.js`.

### OMCT-C03-L2-03.04 — Import into composition

Open MCT shall import a valid JSON object tree into an eligible parent composition.

Acceptance criteria:

- **GIVEN** a valid Open MCT JSON export and a parent that supports composition
- **WHEN** the import action completes
- **THEN** Open MCT shall create remapped objects and attach the imported root to the parent

Implementation evidence: `src/plugins/importFromJSONAction/ImportFromJSONAction.js`,
`src/plugins/importFromJSONAction/ImportFromJSONActionSpec.js`.

### OMCT-C03-L2-03.05 — Import identifier integrity

Open MCT shall prevent imported property data from overriding generated namespace and key
identity.

Acceptance criteria:

- **GIVEN** imported JSON containing identifier-like properties
- **WHEN** objects are created from the import
- **THEN** Open MCT shall preserve the generated identifier namespace and key

Implementation evidence: `src/plugins/importFromJSONAction/ImportFromJSONAction.js`,
`src/plugins/importFromJSONAction/ImportFromJSONActionSpec.js`.

### OMCT-C03-L2-03.06 — Prototype-pollution rejection

Open MCT shall reject imported content that attempts prototype pollution.

Acceptance criteria:

- **GIVEN** JSON content containing a prototype-pollution payload
- **WHEN** the import action parses the content
- **THEN** Open MCT shall leave global object prototypes unchanged

Implementation evidence: `src/plugins/importFromJSONAction/ImportFromJSONAction.js`,
`src/plugins/importFromJSONAction/ImportFromJSONActionSpec.js`.

## OMCT-C03-L1-04 — Navigation and data-control actions

Open MCT shall expose context-sensitive actions for navigation, refresh, and data reset.

### OMCT-C03-L2-04.01 — Original-location navigation

Open MCT shall navigate from an alias to the original object's hierarchy location.

Acceptance criteria:

- **GIVEN** a selected alias with an original object path
- **WHEN** the go-to-original action runs
- **THEN** Open MCT shall navigate to the original path

Implementation evidence: `src/plugins/goToOriginalAction/GoToOriginalAction.js`,
`src/plugins/goToOriginalAction/pluginSpec.js`.

### OMCT-C03-L2-04.02 — New-tab navigation

Open MCT shall open an applicable object route in a separate browser tab.

Acceptance criteria:

- **GIVEN** a selected navigable object
- **WHEN** the open-in-new-tab action runs
- **THEN** Open MCT shall open that object's route in a new tab

Implementation evidence: `src/plugins/openInNewTabAction/openInNewTabAction.js`,
`src/plugins/openInNewTabAction/pluginSpec.js`.

### OMCT-C03-L2-04.03 — Object reload

Open MCT shall refresh an applicable domain object from its provider.

Acceptance criteria:

- **GIVEN** a provider-backed selected object
- **WHEN** the reload action runs
- **THEN** Open MCT shall request fresh provider state for the object

Implementation evidence: `src/plugins/reloadAction/ReloadAction.js`,
`e2e/tests/functional/plugins/reloadAction/reloadAction.e2e.spec.js`.

### OMCT-C03-L2-04.04 — Global clear-data event

Open MCT shall publish a global clear-data event from an applicable action or indicator.

Acceptance criteria:

- **GIVEN** an installed clear-data plugin
- **WHEN** an operator invokes the action or indicator control
- **THEN** Open MCT shall emit the global clear-data event

Implementation evidence: `src/plugins/clearData/plugin.js`,
`src/plugins/clearData/pluginSpec.js`.

