# C10 — Conditions, derived telemetry, and filtering

## OMCT-C10-L1-01 — Condition evaluation

Open MCT shall evaluate ordered conditions over composed telemetry and publish the selected
output.

### OMCT-C10-L2-01.01 — Condition-set composition

Open MCT shall accept telemetry-producing children and reject nontelemetry children in a
condition set.

Acceptance criteria:

- **GIVEN** a proposed child for a condition set
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow the child only when it produces telemetry

Implementation evidence: `src/plugins/condition/ConditionSetCompositionPolicy.js`,
`src/plugins/condition/ConditionSetCompositionPolicySpec.js`.

### OMCT-C10-L2-01.02 — Criteria operators

Open MCT shall evaluate configured comparison operations against current telemetry values.

Acceptance criteria:

- **GIVEN** a condition criterion with an implemented operation and operands
- **WHEN** relevant telemetry arrives
- **THEN** Open MCT shall produce the Boolean result of that operation

Implementation evidence: `src/plugins/condition/criterion/TelemetryCriterion.js`,
`src/plugins/condition/utils/evaluator.js`.

### OMCT-C10-L2-01.03 — Any and all triggers

Open MCT shall combine criteria using the configured `ANY` or `ALL` trigger.

Acceptance criteria:

- **GIVEN** a condition containing multiple criterion results
- **WHEN** condition evaluation runs
- **THEN** Open MCT shall select true for any matching criterion under `ANY` or every
  matching criterion under `ALL`

Implementation evidence: `src/plugins/condition/utils/evaluator.js`,
`src/plugins/condition/utils/evaluatorSpec.js`.

### OMCT-C10-L2-01.04 — Ordered first match

Open MCT shall stop condition-set evaluation at the first true condition in configured
order.

Acceptance criteria:

- **GIVEN** an ordered condition set with more than one matching condition
- **WHEN** evaluation runs
- **THEN** Open MCT shall publish the output of the first matching condition

Implementation evidence: `src/plugins/condition/components/ConditionSet.vue`,
`src/plugins/condition/pluginSpec.js`.

### OMCT-C10-L2-01.05 — Old-data criterion

Open MCT shall evaluate telemetry as old after its configured no-data interval elapses.

Acceptance criteria:

- **GIVEN** a condition that checks telemetry age
- **WHEN** no matching telemetry arrives within the configured interval
- **THEN** Open MCT shall evaluate the old-data criterion as true

Implementation evidence: `src/plugins/condition/criterion/TelemetryCriterion.js`,
`src/plugins/condition/pluginSpec.js`.

### OMCT-C10-L2-01.06 — Condition editing

Open MCT shall persist additions, removals, reordering, criteria, triggers, and output
properties from the condition inspector.

Acceptance criteria:

- **GIVEN** an editable condition set
- **WHEN** an operator changes an exposed condition property
- **THEN** Open MCT shall update and save the condition-set configuration

Implementation evidence: `src/plugins/condition/ConditionManager.js`,
`src/plugins/condition/ConditionManagerSpec.js`.

## OMCT-C10-L1-02 — Conditional presentation and summary widgets

Open MCT shall drive visual state and output telemetry from condition results.

### OMCT-C10-L2-02.01 — Conditional styles

Open MCT shall apply the styles associated with the active condition-set output.

Acceptance criteria:

- **GIVEN** a styled object linked to a condition set
- **WHEN** the active condition output changes
- **THEN** Open MCT shall replace applicable conditional styles with the new output styles

Implementation evidence: `src/plugins/condition/StyleRuleManager.js`,
`src/plugins/condition/pluginSpec.js`.

### OMCT-C10-L2-02.02 — Condition widget output

Open MCT shall display a condition widget's active label, URL, and configured styles.

Acceptance criteria:

- **GIVEN** a condition widget linked to a condition set
- **WHEN** the condition set publishes an output
- **THEN** Open MCT shall render that output's configured widget content

Implementation evidence: `src/plugins/conditionWidget/components/ConditionWidget.vue`,
`src/plugins/conditionWidget/pluginSpec.js`.

### OMCT-C10-L2-02.03 — Summary-widget rules

Open MCT shall select a summary-widget visual rule from telemetry conditions.

Acceptance criteria:

- **GIVEN** a summary widget with ordered rules over composed telemetry
- **WHEN** telemetry causes a rule to match
- **THEN** Open MCT shall display that rule's text, icon, image, color, or border properties

Implementation evidence: `src/plugins/summaryWidget/src/SummaryWidget.js`,
`src/plugins/summaryWidget/src/telemetry/SummaryWidgetEvaluator.js`.

### OMCT-C10-L2-02.04 — Summary-widget aggregate conditions

Open MCT shall evaluate conditions over one object, any composed object, or all composed
objects.

Acceptance criteria:

- **GIVEN** a summary-widget condition with its object scope
- **WHEN** the widget evaluates current telemetry
- **THEN** Open MCT shall apply the configured single, any, or all matching semantics

Implementation evidence: `src/plugins/summaryWidget/src/telemetry/SummaryWidgetCondition.js`,
`src/plugins/summaryWidget/src/telemetry/SummaryWidgetConditionSpec.js`.

### OMCT-C10-L2-02.05 — Summary-widget test data

Open MCT shall allow temporary test telemetry to preview summary-widget rules in edit mode.

Acceptance criteria:

- **GIVEN** a summary widget in edit mode
- **WHEN** an operator enables and changes test data
- **THEN** Open MCT shall evaluate the preview with test values without persisting them as
  source telemetry

Implementation evidence: `src/plugins/summaryWidget/src/TestDataManager.js`,
`src/plugins/summaryWidget/test/TestDataManagerSpec.js`.

## OMCT-C10-L1-03 — Derived telemetry

Open MCT shall calculate new telemetry streams from implemented source-combination
operations.

### OMCT-C10-L2-03.01 — Mathematical derived telemetry

Open MCT shall evaluate a configured mathematical expression over timestamp-aligned source
telemetry.

Acceptance criteria:

- **GIVEN** a derived-telemetry object with source parameters and an expression
- **WHEN** historical or realtime source data share the reference timestamp
- **THEN** Open MCT shall emit the expression result at that timestamp

Implementation evidence: `src/plugins/comps/CompsMathWorker.js`,
`src/plugins/comps/CompsTelemetryProvider.js`.

### OMCT-C10-L2-03.02 — Derived sample windows

Open MCT shall delay accumulated expression output until the configured sample size is
available.

Acceptance criteria:

- **GIVEN** an accumulated derived parameter with a positive sample size
- **WHEN** fewer source samples than that size are available
- **THEN** Open MCT shall omit the derived result until the window is full

Implementation evidence: `src/plugins/comps/CompsMathWorker.js`.

### OMCT-C10-L2-03.03 — Mean telemetry

Open MCT shall emit the arithmetic mean of the configured recent sample window.

Acceptance criteria:

- **GIVEN** a mean-telemetry object with a source range and sample count
- **WHEN** at least that count of source values is available
- **THEN** Open MCT shall emit their mean using the latest sample window

Implementation evidence: `src/plugins/telemetryMean/src/MeanTelemetryProvider.js`,
`src/plugins/telemetryMean/src/MeanTelemetryProviderSpec.js`.

### OMCT-C10-L2-03.04 — Timestamp correlation

Open MCT shall correlate two telemetry sources when their timestamps are equal.

Acceptance criteria:

- **GIVEN** a correlation-telemetry object with horizontal and vertical sources
- **WHEN** both sources provide values at the same parsed timestamp
- **THEN** Open MCT shall emit a datum containing the paired values and that timestamp

Implementation evidence: `src/plugins/correlationTelemetryPlugin/plugin.js`,
`e2e/tests/functional/plugins/correlationTelemetry/correlationTelemetry.e2e.spec.js`.

## OMCT-C10-L1-04 — Provider-side telemetry filters

Open MCT shall configure and transmit metadata-defined telemetry filters.

### OMCT-C10-L2-04.01 — Filter control selection

Open MCT shall render selection or text controls according to telemetry filter metadata.

Acceptance criteria:

- **GIVEN** telemetry metadata containing filter definitions
- **WHEN** the filter inspector renders
- **THEN** Open MCT shall display radio, checkbox, or text input controls according to the
  available values and selection threshold

Implementation evidence: `src/plugins/filters/components/FilterField.vue`,
`src/plugins/filters/README.md`.

### OMCT-C10-L2-04.02 — Object and global filter scope

Open MCT shall persist filters for one telemetry object or for all compatible objects in a
configured view.

Acceptance criteria:

- **GIVEN** a filter-enabled composite telemetry view
- **WHEN** the operator saves an object-specific or global filter
- **THEN** Open MCT shall store the filter under the corresponding scope

Implementation evidence: `src/plugins/filters/components/FiltersView.vue`,
`src/plugins/filters/components/GlobalFilters.vue`.

### OMCT-C10-L2-04.03 — Filter request propagation

Open MCT shall include active filter configuration in historical requests and realtime
subscriptions.

Acceptance criteria:

- **GIVEN** a telemetry view with saved filters
- **WHEN** the view requests or subscribes to telemetry
- **THEN** Open MCT shall pass the applicable filters in provider options

Implementation evidence: `src/plugins/telemetryTable/TelemetryTable.js`,
`src/plugins/filters/README.md`.
