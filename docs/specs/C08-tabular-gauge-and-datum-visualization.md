# C08 — Tabular, gauge, and datum visualization

## OMCT-C08-L1-01 — Telemetry table

Open MCT shall present historical and realtime telemetry in a configurable table.

### OMCT-C08-L2-01.01 — Telemetry rows and metadata columns

Open MCT shall render one row per returned datum and one data column per selected metadata
value.

Acceptance criteria:

- **GIVEN** a table view with telemetry data and metadata
- **WHEN** the historical request resolves
- **THEN** Open MCT shall display the returned data using the configured metadata columns

Implementation evidence: `src/plugins/telemetryTable/TelemetryTable.js`,
`src/plugins/telemetryTable/pluginSpec.js`.

### OMCT-C08-L2-01.02 — Loading indication

Open MCT shall display request progress while a telemetry table loads historical data.

Acceptance criteria:

- **GIVEN** a table with an unresolved telemetry request
- **WHEN** loading begins and completes
- **THEN** Open MCT shall show the progress indicator only while the request is active

Implementation evidence: `src/plugins/telemetryTable/components/TableComponent.vue`,
`src/plugins/telemetryTable/pluginSpec.js`.

### OMCT-C08-L2-01.03 — In-place realtime update

Open MCT shall replace an existing logical table row when incoming telemetry shares its
configured in-place update key.

Acceptance criteria:

- **GIVEN** a table row and a realtime datum with the same in-place update value
- **WHEN** the datum arrives
- **THEN** Open MCT shall update the existing row instead of appending a duplicate row

Implementation evidence: `src/plugins/telemetryTable/TelemetryTable.js`,
`src/plugins/telemetryTable/pluginSpec.js`.

### OMCT-C08-L2-01.04 — Column configuration

Open MCT shall persist column visibility, order, width, and sorting configuration.

Acceptance criteria:

- **GIVEN** an editable telemetry table
- **WHEN** an operator changes a supported column setting
- **THEN** Open MCT shall update the table and save the configuration

Implementation evidence: `src/plugins/telemetryTable/TelemetryTableConfiguration.js`,
`src/plugins/telemetryTable/components/TableConfiguration.vue`.

### OMCT-C08-L2-01.05 — Column filtering and sorting

Open MCT shall filter and sort table rows by configured column values.

Acceptance criteria:

- **GIVEN** a populated telemetry table
- **WHEN** the operator sets a column filter or selects a sort column and direction
- **THEN** Open MCT shall update the visible row set and order

Implementation evidence: `src/plugins/telemetryTable/collections/TableRowCollection.js`,
`src/plugins/telemetryTable/components/TableComponent.vue`.

### OMCT-C08-L2-01.06 — Row marking and pause

Open MCT shall pause realtime table motion when the operator marks a row.

Acceptance criteria:

- **GIVEN** an active realtime telemetry table
- **WHEN** the operator marks a row
- **THEN** Open MCT shall retain the marked row and pause visible realtime updates

Implementation evidence: `src/plugins/telemetryTable/components/TableComponent.vue`,
`src/plugins/telemetryTable/pluginSpec.js`.

### OMCT-C08-L2-01.07 — Bounds-change resume

Open MCT shall resume a paused telemetry table when the operator changes time bounds.

Acceptance criteria:

- **GIVEN** a paused table
- **WHEN** a user-originated bounds change occurs
- **THEN** Open MCT shall clear the paused state and refresh for the new bounds

Implementation evidence: `src/plugins/telemetryTable/components/TableComponent.vue`,
`src/plugins/telemetryTable/pluginSpec.js`.

### OMCT-C08-L2-01.08 — CSV export

Open MCT shall export all table rows or the marked subset as comma-separated values (CSV).

Acceptance criteria:

- **GIVEN** a telemetry table with visible data
- **WHEN** the operator invokes an applicable CSV export action
- **THEN** Open MCT shall produce a CSV file for the selected row scope

Implementation evidence: `src/plugins/telemetryTable/ViewActions.js`,
`src/plugins/telemetryTable/components/TableComponent.vue`, `src/exporters/CSVExporter.js`.

## OMCT-C08-L1-02 — Latest-available-data tables

Open MCT shall present the latest available value for composed telemetry objects.

### OMCT-C08-L2-02.01 — LAD table composition

Open MCT shall accept telemetry-producing objects and reject nontelemetry objects in a
latest-available-data table.

Acceptance criteria:

- **GIVEN** a proposed latest-available-data table child
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow the child only when it produces telemetry

Implementation evidence: `src/plugins/LADTable/LADTableCompositionPolicy.js`,
`src/plugins/LADTable/pluginSpec.js`.

### OMCT-C08-L2-02.02 — Latest value per object

Open MCT shall render one row per composed telemetry object using its latest datum.

Acceptance criteria:

- **GIVEN** a latest-available-data table with composed telemetry objects
- **WHEN** the table loads or receives updated data
- **THEN** Open MCT shall show each object's name and latest domain and range values

Implementation evidence: `src/plugins/LADTable/components/LadTable.vue`,
`src/plugins/LADTable/pluginSpec.js`.

### OMCT-C08-L2-02.03 — LAD table sets

Open MCT shall present composed latest-available-data tables as a table set.

Acceptance criteria:

- **GIVEN** a latest-available-data table-set object
- **WHEN** its view renders
- **THEN** Open MCT shall display one set row or section for each composed table

Implementation evidence: `src/plugins/LADTable/components/LadTableSet.vue`,
`src/plugins/LADTable/pluginSpec.js`.

## OMCT-C08-L1-03 — Gauge visualization

Open MCT shall display the latest numeric telemetry value in configurable gauge forms.

### OMCT-C08-L2-03.01 — Gauge forms

Open MCT shall render filled dial, needle dial, vertical meter, inverted vertical meter,
and horizontal meter gauge forms.

Acceptance criteria:

- **GIVEN** a gauge configured with one implemented form
- **WHEN** its view renders
- **THEN** Open MCT shall display that form with its configured range

Implementation evidence: `src/plugins/gauge/components/GaugeComponent.vue`,
`src/plugins/gauge/GaugePluginSpec.js`.

### OMCT-C08-L2-03.02 — Latest gauge value

Open MCT shall update a gauge from the latest value of its composed telemetry source.

Acceptance criteria:

- **GIVEN** a gauge containing compatible telemetry
- **WHEN** the source emits a numeric datum
- **THEN** Open MCT shall display the formatted range value at the corresponding gauge
  position

Implementation evidence: `src/plugins/gauge/components/GaugeComponent.vue`,
`src/plugins/gauge/GaugePluginSpec.js`.

### OMCT-C08-L2-03.03 — Gauge limits

Open MCT shall use configured bounds or applicable telemetry limits for gauge range and
limit markers.

Acceptance criteria:

- **GIVEN** a gauge configured for manual bounds or telemetry-derived limits
- **WHEN** the gauge renders
- **THEN** Open MCT shall display the selected minimum, maximum, low-limit, and high-limit
  values

Implementation evidence: `src/plugins/gauge/GaugePlugin.js`,
`src/plugins/gauge/components/GaugeComponent.vue`.

## OMCT-C08-L1-04 — Autoflow and datum detail

Open MCT shall provide compact multi-object telemetry and per-datum inspection views.

### OMCT-C08-L2-04.01 — Autoflow rows

Open MCT shall render one autoflow row per composed child and reflow rows across available
columns.

Acceptance criteria:

- **GIVEN** an autoflow-compatible object with composed children
- **WHEN** the view loads or its size changes
- **THEN** Open MCT shall distribute the child rows across the available columns

Implementation evidence: `src/plugins/autoflow/AutoflowTabularView.js`,
`src/plugins/autoflow/AutoflowTabularPluginSpec.js`.

### OMCT-C08-L2-04.02 — Autoflow telemetry and limits

Open MCT shall display historical and incoming child telemetry with applicable limit
styling in autoflow rows.

Acceptance criteria:

- **GIVEN** populated autoflow rows
- **WHEN** historical or realtime telemetry is processed
- **THEN** Open MCT shall update each row's value and limit class

Implementation evidence: `src/plugins/autoflow/AutoflowTabularRowController.js`,
`src/plugins/autoflow/AutoflowTabularPluginSpec.js`.

### OMCT-C08-L2-04.03 — Autoflow composition changes

Open MCT shall add or remove autoflow rows as composition changes.

Acceptance criteria:

- **GIVEN** a mounted autoflow view
- **WHEN** a child enters or leaves composition
- **THEN** Open MCT shall update the row set and its telemetry subscriptions

Implementation evidence: `src/plugins/autoflow/AutoflowTabularController.js`,
`src/plugins/autoflow/AutoflowTabularPluginSpec.js`.

### OMCT-C08-L2-04.04 — Datum detail overlay

Open MCT shall display the metadata fields of a selected telemetry datum in an overlay.

Acceptance criteria:

- **GIVEN** a selected datum in a compatible view
- **WHEN** the view-datum action runs
- **THEN** Open MCT shall open an overlay containing the datum's formatted metadata values

Implementation evidence: `src/plugins/viewDatumAction/ViewDatumAction.js`,
`src/plugins/viewDatumAction/pluginSpec.js`.

