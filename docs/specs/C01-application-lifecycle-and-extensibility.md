# C01 — Application lifecycle and extensibility

## OMCT-C01-L1-01 — Configurable application instance

Open MCT shall provide a configurable application instance whose capabilities can be
extended before startup.

### OMCT-C01-L2-01.01 — Plugin installation

Open MCT shall invoke each installed plugin with the active application instance.

Acceptance criteria:

- **GIVEN** an application instance and a plugin installation function
- **WHEN** the integrator installs the plugin
- **THEN** Open MCT shall call the function once with that application instance

Implementation evidence: `src/MCT.js`, `src/MCTSpec.js`.

### OMCT-C01-L2-01.02 — Public capability APIs

Open MCT shall expose the capability APIs initialized by the application constructor.

Acceptance criteria:

- **GIVEN** a newly constructed application instance
- **WHEN** an extension inspects the instance
- **THEN** Open MCT shall expose the object, composition, telemetry, time, action, user,
  notification, status, fault, form, annotation, routing, overlay, menu, tooltip, editor,
  indicator, branding, priority, type, view, inspector, and toolbar interfaces

Implementation evidence: `src/MCT.js`, `src/api/api.js`.

### OMCT-C01-L2-01.03 — Default plugin installation

Open MCT shall install its baseline product plugins during instance construction.

Acceptance criteria:

- **GIVEN** a new application instance with no integrator configuration
- **WHEN** construction completes
- **THEN** Open MCT shall register the baseline views and actions declared in the constructor

Implementation evidence: `src/MCT.js`, `src/plugins/plugins.js`.

### OMCT-C01-L2-01.04 — Published plugin catalog

Open MCT shall expose factory functions for the shipped optional plugins.

Acceptance criteria:

- **GIVEN** a constructed application instance
- **WHEN** an integrator reads `openmct.plugins`
- **THEN** Open MCT shall provide the plugin factories exported by `src/plugins/plugins.js`

Implementation evidence: `src/plugins/plugins.js`, `src/MCTSpec.js`.

### OMCT-C01-L2-01.05 — Build identification

Open MCT shall expose its version, build date, revision, and source branch.

Acceptance criteria:

- **GIVEN** a built application instance
- **WHEN** an extension reads `buildInfo`
- **THEN** Open MCT shall return values for `version`, `buildDate`, `revision`, and `branch`

Implementation evidence: `src/MCT.js`, `.webpack/webpack.common.mjs`.

## OMCT-C01-L1-02 — Browser and headless startup

Open MCT shall support controlled startup in rendered and headless operating modes.

### OMCT-C01-L2-02.01 — Deferred browser startup

Open MCT shall defer bootstrap until the browser document is ready.

Acceptance criteria:

- **GIVEN** a document whose ready state is `loading`
- **WHEN** the application start method is called
- **THEN** Open MCT shall bootstrap once after `DOMContentLoaded`

Implementation evidence: `src/MCT.js`.

### OMCT-C01-L2-02.02 — Explicit mount target

Open MCT shall render the application into a supplied element or a valid selector target.

Acceptance criteria:

- **GIVEN** an existing HTML element or a selector that resolves to one
- **WHEN** rendered startup occurs
- **THEN** Open MCT shall mount the application layout in that element

Implementation evidence: `src/MCT.js`, `src/MCTSpec.js`.

### OMCT-C01-L2-02.03 — Implicit mount target

Open MCT shall create a mount element when startup receives no target.

Acceptance criteria:

- **GIVEN** no mount element or selector
- **WHEN** rendered startup occurs
- **THEN** Open MCT shall append a mount element to the document body and use it

Implementation evidence: `src/MCT.js`.

### OMCT-C01-L2-02.04 — Invalid mount target rejection

Open MCT shall reject an invalid or unresolved mount target.

Acceptance criteria:

- **GIVEN** a selector with no matching element or an unsupported target value
- **WHEN** startup attempts to resolve the target
- **THEN** Open MCT shall throw an error that identifies the invalid startup input

Implementation evidence: `src/MCT.js`.

### OMCT-C01-L2-02.05 — Headless startup

Open MCT shall initialize services and routing without rendering the application layout in
headless mode.

Acceptance criteria:

- **GIVEN** a configured application instance
- **WHEN** `startHeadless` is invoked
- **THEN** Open MCT shall start routing and emit the startup event without mounting the
  visible layout

Implementation evidence: `src/MCT.js`, `src/MCTSpec.js`.

### OMCT-C01-L2-02.06 — Startup event

Open MCT shall emit `start` only after startup initialization completes.

Acceptance criteria:

- **GIVEN** a listener registered before startup
- **WHEN** rendered or headless startup completes
- **THEN** Open MCT shall emit one `start` event

Implementation evidence: `src/MCT.js`, `src/MCTSpec.js`.

### OMCT-C01-L2-02.07 — Initial route and clock

Open MCT shall establish a browse route and an active default clock during startup.

Acceptance criteria:

- **GIVEN** no active clock and the root application route
- **WHEN** startup bootstraps the application
- **THEN** Open MCT shall activate the configured default clock and redirect the root route
  to `/browse/`

Implementation evidence: `src/MCT.js`.

## OMCT-C01-L1-03 — Host integration lifecycle

Open MCT shall provide host-facing controls for assets and teardown.

### OMCT-C01-L2-03.01 — Asset-path normalization

Open MCT shall normalize the configured asset path with one trailing slash.

Acceptance criteria:

- **GIVEN** an asset path with or without a trailing slash
- **WHEN** an extension retrieves the path
- **THEN** Open MCT shall return the path with a trailing slash

Implementation evidence: `src/MCT.js`, `src/MCTSpec.js`.

### OMCT-C01-L2-03.02 — Default asset path

Open MCT shall use `/` when no asset path has been configured.

Acceptance criteria:

- **GIVEN** an application instance with no explicit asset path
- **WHEN** an extension retrieves the asset path
- **THEN** Open MCT shall return `/`

Implementation evidence: `src/MCT.js`.

### OMCT-C01-L2-03.03 — Teardown notification

Open MCT shall notify registered extensions when the application is destroyed.

Acceptance criteria:

- **GIVEN** a started application and a listener for `destroy`
- **WHEN** the host destroys the application or the browser unloads it
- **THEN** Open MCT shall emit the `destroy` event and remove its unload listener

Implementation evidence: `src/MCT.js`.

