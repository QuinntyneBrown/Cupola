# C07 — Plot and chart visualization

## OMCT-C07-L1-01 — Time-series plot availability

Open MCT shall provide time-series plot views and composable plot objects for compatible
telemetry.

### OMCT-C07-L2-01.01 — Numeric telemetry plot

Open MCT shall provide a single-series plot view for telemetry with a numeric range.

Acceptance criteria:

- **GIVEN** a telemetry object whose metadata includes a numeric range
- **WHEN** view applicability is evaluated
- **THEN** Open MCT shall offer the telemetry plot view

Implementation evidence: `src/plugins/plot/PlotViewProvider.js`,
`src/plugins/plot/pluginSpec.js`.

### OMCT-C07-L2-01.02 — Nonnumeric exclusion

Open MCT shall withhold the plot view when every telemetry range is nonnumeric.

Acceptance criteria:

- **GIVEN** a telemetry object with only nonnumeric ranges
- **WHEN** view applicability is evaluated
- **THEN** Open MCT shall not offer the telemetry plot view

Implementation evidence: `src/plugins/plot/PlotViewProvider.js`,
`src/plugins/plot/pluginSpec.js`.

### OMCT-C07-L2-01.03 — Overlay plot composition

Open MCT shall allow compatible telemetry objects in an overlay plot.

Acceptance criteria:

- **GIVEN** an overlay plot and telemetry with a numeric range
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow the telemetry object as an overlay series

Implementation evidence: `src/plugins/plot/overlayPlot/OverlayPlotCompositionPolicy.js`,
`src/plugins/plot/pluginSpec.js`.

### OMCT-C07-L2-01.04 — Stacked plot composition

Open MCT shall allow compatible telemetry and plot objects in a stacked plot.

Acceptance criteria:

- **GIVEN** a stacked plot and an eligible child object
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow the child as a stacked-plot row

Implementation evidence: `src/plugins/plot/stackedPlot/StackedPlotCompositionPolicy.js`,
`src/plugins/plot/pluginSpec.js`.

## OMCT-C07-L1-02 — Plot data rendering and navigation

Open MCT shall render historical and realtime telemetry against configurable axes and
interactive navigation controls.

### OMCT-C07-L2-02.01 — Initial historical request

Open MCT shall request initial telemetry once when a plot view loads.

Acceptance criteria:

- **GIVEN** a plot view for a telemetry object
- **WHEN** the view mounts
- **THEN** Open MCT shall issue one initial request for the active time bounds

Implementation evidence: `src/plugins/plot/PlotView.vue`, `src/plugins/plot/pluginSpec.js`.

### OMCT-C07-L2-02.02 — Realtime point rendering

Open MCT shall add subscribed telemetry points to an active plot.

Acceptance criteria:

- **GIVEN** a mounted plot with a realtime subscription
- **WHEN** the provider emits a new datum
- **THEN** Open MCT shall render the datum at its domain and range coordinates

Implementation evidence: `src/plugins/plot/MctPlot.vue`,
`src/plugins/plot/stackedPlot/pluginSpec.js`.

### OMCT-C07-L2-02.03 — Axis ticks and labels

Open MCT shall render domain and range axes from active time and telemetry metadata.

Acceptance criteria:

- **GIVEN** plot data and normalized metadata
- **WHEN** the plot renders
- **THEN** Open MCT shall display formatted axis ticks and configured labels

Implementation evidence: `src/plugins/plot/axis/XAxis.vue`, `src/plugins/plot/axis/YAxis.vue`,
`src/plugins/plot/pluginSpec.js`.

### OMCT-C07-L2-02.04 — Legend modes

Open MCT shall render a plot legend in collapsed or expanded mode.

Acceptance criteria:

- **GIVEN** a plot with one or more series
- **WHEN** legend display mode changes
- **THEN** Open MCT shall render every series using the selected legend mode

Implementation evidence: `src/plugins/plot/legend/PlotLegend.vue`,
`src/plugins/plot/pluginSpec.js`.

### OMCT-C07-L2-02.05 — Pan and zoom

Open MCT shall update plot scales in response to supported pan and zoom interactions.

Acceptance criteria:

- **GIVEN** an interactive plot outside a restricted time-strip context
- **WHEN** the operator pans or zooms the plot
- **THEN** Open MCT shall update the applicable scale and request data when the new bounds
  require it

Implementation evidence: `src/plugins/plot/MctPlot.vue`,
`e2e/tests/functional/plugins/plot/plotControls.e2e.spec.js`.

### OMCT-C07-L2-02.06 — Pause and resume

Open MCT shall pause automatic plot movement during direct inspection and resume it through
the implemented controls.

Acceptance criteria:

- **GIVEN** an active plot with pause controls
- **WHEN** the operator pauses or resumes the view
- **THEN** Open MCT shall preserve the inspected window while paused and follow active time
  after resume

Implementation evidence: `src/plugins/plot/PlotView.vue`, `src/plugins/plot/pluginSpec.js`.

### OMCT-C07-L2-02.07 — Telemetry limit display

Open MCT shall display configured telemetry limit lines and alarm styling on demand.

Acceptance criteria:

- **GIVEN** telemetry with applicable limits and a plot configured to show them
- **WHEN** the plot renders
- **THEN** Open MCT shall render the limit lines and applicable alarm-state points or lines

Implementation evidence: `src/plugins/plot/chart/LimitLine.vue`,
`src/plugins/plot/chart/MCTChartAlarmPointSet.js`, `src/plugins/plot/pluginSpec.js`.

## OMCT-C07-L1-03 — Multi-series plot presentation

Open MCT shall coordinate axes, guides, grids, styles, and composition changes across
multi-series plots.

### OMCT-C07-L2-03.01 — Overlay axes

Open MCT shall render overlay plots with one shared range axis or per-series range axes as
configured.

Acceptance criteria:

- **GIVEN** an overlay plot containing telemetry series
- **WHEN** single-axis or multiple-axis mode is selected
- **THEN** Open MCT shall render the corresponding range-axis arrangement

Implementation evidence: `src/plugins/plot/overlayPlot/OverlayPlotViewProvider.js`,
`src/plugins/plot/overlayPlot/pluginSpec.js`.

### OMCT-C07-L2-03.02 — Stacked series lifecycle

Open MCT shall add and remove rendered stacked rows as composition changes.

Acceptance criteria:

- **GIVEN** a mounted stacked plot
- **WHEN** a compatible child is added to or removed from composition
- **THEN** Open MCT shall add or remove the corresponding rendered series

Implementation evidence: `src/plugins/plot/stackedPlot/StackedPlot.vue`,
`src/plugins/plot/stackedPlot/pluginSpec.js`.

### OMCT-C07-L2-03.03 — Coordinated cursor guides

Open MCT shall coordinate cursor guides across stacked telemetry rows.

Acceptance criteria:

- **GIVEN** a stacked plot with cursor guides enabled
- **WHEN** the pointer moves over one row
- **THEN** Open MCT shall display the aligned guide state across the stacked rows

Implementation evidence: `src/plugins/plot/stackedPlot/StackedPlot.vue`,
`src/plugins/plot/stackedPlot/pluginSpec.js`.

### OMCT-C07-L2-03.04 — Grid and series styles

Open MCT shall apply configured grid visibility and series style properties.

Acceptance criteria:

- **GIVEN** a plot with saved grid, color, line, point, and interpolation settings
- **WHEN** the plot renders or configuration changes
- **THEN** Open MCT shall render each series using those settings

Implementation evidence: `src/plugins/plot/configuration/PlotSeries.js`,
`src/plugins/plot/stackedPlot/pluginSpec.js`.

## OMCT-C07-L1-04 — Specialized charts and configuration

Open MCT shall provide bar, spectral, and scatter visualizations with inspectors for their
implemented configuration.

### OMCT-C07-L2-04.01 — Bar-chart eligibility

Open MCT shall accept telemetry with at least one range in a bar chart and reject condition
sets.

Acceptance criteria:

- **GIVEN** a proposed bar-chart child
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow compatible range telemetry and reject incompatible or
  condition-set objects

Implementation evidence: `src/plugins/charts/bar/BarGraphCompositionPolicy.js`,
`src/plugins/charts/bar/pluginSpec.js`.

### OMCT-C07-L2-04.02 — Scalar and spectral bars

Open MCT shall render scalar range values as bars and array range values as spectral bars.

Acceptance criteria:

- **GIVEN** a bar chart containing scalar or array-valued telemetry
- **WHEN** telemetry arrives
- **THEN** Open MCT shall render the corresponding bar or spectral representation

Implementation evidence: `src/plugins/charts/bar/BarGraphView.vue`,
`src/plugins/charts/bar/pluginSpec.js`.

### OMCT-C07-L2-04.03 — Scatter-plot eligibility

Open MCT shall accept telemetry with at least two ranges in a scatter plot.

Acceptance criteria:

- **GIVEN** a proposed scatter-plot child
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow the child only when its metadata supplies two range values

Implementation evidence: `src/plugins/charts/scatter/ScatterPlotCompositionPolicy.js`,
`src/plugins/charts/scatter/pluginSpec.js`.

### OMCT-C07-L2-04.04 — Scatter axes

Open MCT shall plot one configured range against another configured range.

Acceptance criteria:

- **GIVEN** a scatter plot with selected horizontal and vertical range keys
- **WHEN** telemetry is rendered
- **THEN** Open MCT shall position each point from those two range values

Implementation evidence: `src/plugins/charts/scatter/ScatterPlotView.vue`,
`src/plugins/charts/scatter/pluginSpec.js`.

### OMCT-C07-L2-04.05 — Inspector persistence

Open MCT shall persist editable plot and chart options from their inspector views.

Acceptance criteria:

- **GIVEN** an editable plot or chart and its inspector
- **WHEN** an operator changes an exposed option
- **THEN** Open MCT shall save the option in the domain object's configuration

Implementation evidence: `src/plugins/plot/inspector`, `src/plugins/charts/bar/plugin.js`,
`src/plugins/charts/scatter/plugin.js`.

