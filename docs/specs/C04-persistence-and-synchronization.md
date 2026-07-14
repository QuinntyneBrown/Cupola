# C04 — Persistence and synchronization

## OMCT-C04-L1-01 — Browser-local persistence

Open MCT shall provide namespace-scoped persistence in browser local storage.

### OMCT-C04-L2-01.01 — Storage initialization

Open MCT shall initialize its local-storage area when the configured area does not exist.

Acceptance criteria:

- **GIVEN** an empty browser local-storage area
- **WHEN** the local-storage plugin initializes
- **THEN** Open MCT shall create the configured storage structure

Implementation evidence: `src/plugins/localStorage/LocalStorageObjectProvider.js`,
`src/plugins/localStorage/pluginSpec.js`.

### OMCT-C04-L2-01.02 — Local create, update, and retrieve

Open MCT shall persist and retrieve domain objects by identifier in local storage.

Acceptance criteria:

- **GIVEN** a domain object in the local-storage namespace
- **WHEN** the provider saves and subsequently retrieves it
- **THEN** Open MCT shall return the saved serializable state

Implementation evidence: `src/plugins/localStorage/LocalStorageObjectProvider.js`,
`src/plugins/localStorage/pluginSpec.js`.

### OMCT-C04-L2-01.03 — Local-storage input hardening

Open MCT shall prevent manipulated local-storage content from polluting object prototypes.

Acceptance criteria:

- **GIVEN** local-storage content containing prototype-control properties
- **WHEN** the provider retrieves that content
- **THEN** Open MCT shall leave global object prototypes unchanged

Implementation evidence: `src/plugins/localStorage/LocalStorageObjectProvider.js`,
`src/plugins/localStorage/pluginSpec.js`.

## OMCT-C04-L1-02 — CouchDB persistence

Open MCT shall provide remote object persistence and synchronization through a configured
CouchDB database.

### OMCT-C04-L2-02.01 — CouchDB object operations

Open MCT shall retrieve, create, and update objects through the CouchDB provider.

Acceptance criteria:

- **GIVEN** a reachable configured CouchDB namespace
- **WHEN** a consumer gets or saves an object in that namespace
- **THEN** Open MCT shall perform the corresponding database operation

Implementation evidence: `src/plugins/persistence/couch/CouchObjectProvider.js`,
`src/plugins/persistence/couch/pluginSpec.js`.

### OMCT-C04-L2-02.02 — Concurrent request batching

Open MCT shall batch simultaneous CouchDB retrievals while leaving a single retrieval
unbatched.

Acceptance criteria:

- **GIVEN** one or more retrievals queued in the batching interval
- **WHEN** the provider dispatches the queue
- **THEN** Open MCT shall use a batch request for concurrent retrievals and a direct request
  for one retrieval

Implementation evidence: `src/plugins/persistence/couch/CouchObjectQueue.js`,
`src/plugins/persistence/couch/pluginSpec.js`.

### OMCT-C04-L2-02.03 — Persistence batching results

Open MCT shall report success and failure separately for objects in a batched CouchDB save.

Acceptance criteria:

- **GIVEN** a save batch whose database response contains successful and failed entries
- **WHEN** the batch completes
- **THEN** Open MCT shall resolve or reject each queued object according to its own result

Implementation evidence: `src/plugins/persistence/couch/CouchObjectQueue.js`,
`src/plugins/persistence/couch/pluginSpec.js`.

### OMCT-C04-L2-02.04 — Shared-worker fallback

Open MCT shall retain CouchDB persistence when shared workers are unavailable.

Acceptance criteria:

- **GIVEN** a browser without shared-worker support
- **WHEN** the CouchDB provider saves or retrieves an object
- **THEN** Open MCT shall execute the operation without a shared worker

Implementation evidence: `src/plugins/persistence/couch/CouchObjectProvider.js`,
`src/plugins/persistence/couch/pluginSpec.js`.

### OMCT-C04-L2-02.05 — Remote changes

Open MCT shall relay CouchDB change-feed updates to observers of affected domain objects.

Acceptance criteria:

- **GIVEN** an observed CouchDB-backed object
- **WHEN** the changes feed reports an updated document
- **THEN** Open MCT shall notify the object's observers with the remote state

Implementation evidence: `src/plugins/persistence/couch/CouchChangesFeed.js`,
`src/plugins/persistence/couch/CouchObjectProvider.js`.

### OMCT-C04-L2-02.06 — Connection status

Open MCT shall display CouchDB connection state as pending, connected, disconnected, or
unknown.

Acceptance criteria:

- **GIVEN** an installed CouchDB status indicator
- **WHEN** request state changes
- **THEN** Open MCT shall update the indicator to the corresponding connection state

Implementation evidence: `src/plugins/persistence/couch/CouchStatusIndicator.js`,
`src/plugins/persistence/couch/pluginSpec.js`.

### OMCT-C04-L2-02.07 — Persistence conflicts

Open MCT shall surface create or update conflicts to the operator.

Acceptance criteria:

- **GIVEN** a provider rejection identified as a persistence conflict
- **WHEN** an object save fails
- **THEN** Open MCT shall issue a conflict notification and preserve the unsaved state

Implementation evidence: `src/api/objects/ConflictError.js`, `src/api/objects/ObjectAPI.js`,
`src/api/objects/ObjectAPISpec.js`.

## OMCT-C04-L1-03 — Static and searched persistence views

Open MCT shall expose immutable object trees and database-backed search folders as hierarchy
content.

### OMCT-C04-L2-03.01 — Static root loading

Open MCT shall load a configured static JSON object tree as a root hierarchy.

Acceptance criteria:

- **GIVEN** a valid static root resource and namespace configuration
- **WHEN** the static-root plugin initializes
- **THEN** Open MCT shall register the remapped root and its children as provider objects

Implementation evidence: `src/plugins/staticRootPlugin/plugin.js`,
`src/plugins/staticRootPlugin/StaticModelProvider.js`.

### OMCT-C04-L2-03.02 — Static identifier remapping

Open MCT shall remap identifiers, locations, compositions, and known layout references in a
static tree to its configured namespace.

Acceptance criteria:

- **GIVEN** a static tree containing internal object references
- **WHEN** the static provider loads the tree
- **THEN** Open MCT shall preserve internal relationships using the remapped identifiers

Implementation evidence: `src/plugins/staticRootPlugin/StaticModelProvider.js`,
`src/plugins/staticRootPlugin/StaticModelProviderSpec.js`.

### OMCT-C04-L2-03.03 — CouchDB search folders

Open MCT shall present configured CouchDB query results as folder composition.

Acceptance criteria:

- **GIVEN** a CouchDB search-folder root and a matching database query
- **WHEN** its composition loads
- **THEN** Open MCT shall return the matching database objects as folder children

Implementation evidence: `src/plugins/CouchDBSearchFolder/plugin.js`,
`src/plugins/CouchDBSearchFolder/pluginSpec.js`.

## OMCT-C04-L1-04 — Persistence evolution

Open MCT shall adapt persisted object state across implemented schema changes.

### OMCT-C04-L2-04.01 — Object migration interception

Open MCT shall apply registered object migrations before consumers use legacy persisted
state.

Acceptance criteria:

- **GIVEN** a retrieved object that matches a migration's legacy condition
- **WHEN** the object migration interceptor runs
- **THEN** Open MCT shall return the migrated representation

Implementation evidence: `src/plugins/objectMigration/plugin.js`,
`src/plugins/objectMigration/Migrations.js`.

### OMCT-C04-L2-04.02 — Legacy identifier conversion

Open MCT shall convert legacy string identifiers and compositions to namespace-key
identifiers.

Acceptance criteria:

- **GIVEN** legacy object data with string identity fields
- **WHEN** object conversion runs
- **THEN** Open MCT shall produce identifier objects and converted composition references

Implementation evidence: `src/api/objects/object-utils.js`,
`src/api/objects/test/object-utilsSpec.js`.
