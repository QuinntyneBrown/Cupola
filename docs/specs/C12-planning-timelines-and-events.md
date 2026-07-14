# C12 — Planning, timelines, events, and activities

## OMCT-C12-L1-01 — Plan visualization

Open MCT shall render externally supplied plans as time-positioned activity groups.

### OMCT-C12-L2-01.01 — Plan data mapping

Open MCT shall normalize standard or source-mapped plan fields into groups and activities.

Acceptance criteria:

- **GIVEN** plan data and an optional source map for activities, group, start, end, identity,
  display, and filter fields
- **WHEN** Open MCT loads the plan
- **THEN** Open MCT shall produce normalized activity groups for rendering

Implementation evidence: `src/plugins/plan/util.js`, `src/plugins/plan/README.md`.

### OMCT-C12-L2-01.02 — Activity swimlanes

Open MCT shall render plan activities in group swimlanes against the active time scale.

Acceptance criteria:

- **GIVEN** normalized grouped activities and active time bounds
- **WHEN** the plan view renders
- **THEN** Open MCT shall position each visible activity by its start and end time within its
  group

Implementation evidence: `src/plugins/plan/components/PlanView.vue`,
`e2e/tests/functional/planning/plan.e2e.spec.js`.

### OMCT-C12-L2-01.03 — Overlap row allocation

Open MCT shall place overlapping activities on separate rows within a group.

Acceptance criteria:

- **GIVEN** activities whose rendered time and label extents overlap
- **WHEN** row allocation runs
- **THEN** Open MCT shall assign the activities to nonoverlapping rows

Implementation evidence: `src/plugins/plan/components/PlanView.vue`,
`src/plugins/plan/README.md`.

### OMCT-C12-L2-01.04 — Activity selection and inspection

Open MCT shall expose selected activity timing and configured metadata in the inspector.

Acceptance criteria:

- **GIVEN** a rendered plan activity
- **WHEN** the operator selects it
- **THEN** Open MCT shall show its formatted timing and display properties in applicable
  inspector views

Implementation evidence: `src/plugins/plan/inspector/ActivityInspectorViewProvider.js`,
`src/plugins/plan/inspector/components/PlanActivitiesView.vue`.

### OMCT-C12-L2-01.05 — Gantt chart composition

Open MCT shall provide a creatable Gantt chart that composes eligible plans.

Acceptance criteria:

- **GIVEN** a Gantt chart and a plan object
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow the plan and render it in the chart

Implementation evidence: `src/plugins/plan/GanttChartCompositionPolicy.js`,
`src/plugins/plan/pluginSpec.js`.

## OMCT-C12-L1-02 — Time strips and event tracks

Open MCT shall compose compatible time-based views into an independently configurable time
strip.

### OMCT-C12-L2-02.01 — Time-strip composition

Open MCT shall accept compatible time-based plots, plans, imagery, and event views in a time
strip.

Acceptance criteria:

- **GIVEN** a proposed time-strip child
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow implemented time-based view types and reject incompatible
  objects

Implementation evidence: `src/plugins/timeline/TimelineCompositionPolicy.js`,
`src/plugins/timeline/pluginSpec.js`.

### OMCT-C12-L2-02.02 — Shared time axis

Open MCT shall align composed time-strip child views to one visible time axis.

Acceptance criteria:

- **GIVEN** a time strip with composed children
- **WHEN** its view renders or bounds change
- **THEN** Open MCT shall render each child against the strip's time scale

Implementation evidence: `src/plugins/timeline/TimelineObjectView.vue`,
`src/plugins/timeline/TimelineViewLayout.vue`.

### OMCT-C12-L2-02.03 — Independent time conductor

Open MCT shall provide optional independent time controls for a configured time strip.

Acceptance criteria:

- **GIVEN** a time strip configured for independent time
- **WHEN** its view renders
- **THEN** Open MCT shall expose independent fixed or realtime controls for that strip

Implementation evidence: `src/plugins/timeline/TimelineViewLayout.vue`,
`src/plugins/timeline/pluginSpec.js`.

### OMCT-C12-L2-02.04 — Event telemetry track

Open MCT shall render event telemetry with a domain value and no numeric range or image
value as a time-strip event track.

Acceptance criteria:

- **GIVEN** telemetry metadata with a domain and without range or image hints
- **WHEN** event-track view applicability is evaluated
- **THEN** Open MCT shall offer the event timeline view

Implementation evidence: `src/plugins/events/EventTimelineViewProvider.js`,
`src/plugins/events/mixins/eventData.js`.

### OMCT-C12-L2-02.05 — Extended event lines

Open MCT shall coordinate selected event markers across compatible time-strip rows.

Acceptance criteria:

- **GIVEN** a time strip containing event-capable rows
- **WHEN** an event publishes an extended-line position
- **THEN** Open MCT shall render the aligned marker across participating rows

Implementation evidence: `src/plugins/timeline/ExtendedLinesBus.js`,
`src/plugins/timeline/ExtendedLinesOverlay.vue`.

## OMCT-C12-L1-03 — Time lists

Open MCT shall present plan activities as sortable, filterable time-list entries.

### OMCT-C12-L2-03.01 — Plan loading

Open MCT shall load the plan composed into a time list.

Acceptance criteria:

- **GIVEN** a time list containing an eligible plan
- **WHEN** its view loads
- **THEN** Open MCT shall display the plan's activities and configured headers

Implementation evidence: `src/plugins/timelist/TimelistComponent.vue`,
`src/plugins/timelist/pluginSpec.js`.

### OMCT-C12-L2-03.02 — Activity filtering

Open MCT shall filter time-list activities by name, configured metadata, time class, and
active bounds.

Acceptance criteria:

- **GIVEN** a populated time list with filter configuration
- **WHEN** the list evaluates visible activities
- **THEN** Open MCT shall show only activities that satisfy the active filters or are marked
  in progress

Implementation evidence: `src/plugins/timelist/TimelistComponent.vue`,
`src/plugins/timelist/pluginSpec.js`.

### OMCT-C12-L2-03.03 — Activity sorting

Open MCT shall sort time-list activities by a supported property and direction.

Acceptance criteria:

- **GIVEN** a populated time list
- **WHEN** the operator selects a sortable header
- **THEN** Open MCT shall order visible activities by that property and direction

Implementation evidence: `src/plugins/timelist/TimelistComponent.vue`,
`src/plugins/timelist/pluginSpec.js`.

### OMCT-C12-L2-03.04 — Activity progress

Open MCT shall display current, future, and past activity state with duration and progress.

Acceptance criteria:

- **GIVEN** an activity with start and end times
- **WHEN** the time list updates for the current context time
- **THEN** Open MCT shall render its temporal class, formatted duration, and applicable
  progress

Implementation evidence: `src/plugins/timelist/ExpandedViewItem.vue`,
`src/plugins/timelist/svg-progress.js`.

## OMCT-C12-L1-04 — Execution monitoring state

Open MCT shall persist plan and activity execution-monitoring state in shared domain
objects.

### OMCT-C12-L2-04.01 — Activity-state root

Open MCT shall provide an `Activity States` root representation when the configured object
is unavailable.

Acceptance criteria:

- **GIVEN** the activity-state plugin and a missing activity-state identifier
- **WHEN** the object is retrieved
- **THEN** Open MCT shall return the default activity-state domain object

Implementation evidence: `src/plugins/activityStates/activityStatesInterceptor.js`,
`src/plugins/activityStates/pluginSpec.js`.

### OMCT-C12-L2-04.02 — Activity execution state

Open MCT shall persist the selected execution state by activity identifier.

Acceptance criteria:

- **GIVEN** a selected plan activity with an identifier
- **WHEN** the operator changes its execution state
- **THEN** Open MCT shall update that activity's entry in the activity-state object

Implementation evidence: `src/plugins/plan/inspector/components/PlanActivityStatusView.vue`,
`src/plugins/plan/inspector/components/PlanActivitiesView.vue`.

### OMCT-C12-L2-04.03 — Plan execution-monitoring root

Open MCT shall provide a `Plan Execution Monitoring` root representation when the
configured object is unavailable.

Acceptance criteria:

- **GIVEN** the plan-execution-monitoring plugin and a missing monitoring identifier
- **WHEN** the object is retrieved
- **THEN** Open MCT shall return the default monitoring domain object

Implementation evidence: `src/plugins/planExecutionMonitoring/planExecutionMonitoringInterceptor.js`,
`src/plugins/planExecutionMonitoring/pluginSpec.js`.

### OMCT-C12-L2-04.04 — Plan monitoring status

Open MCT shall persist execution-monitoring status and duration by plan identifier.

Acceptance criteria:

- **GIVEN** a selected plan and the monitoring inspector
- **WHEN** the operator changes status or duration
- **THEN** Open MCT shall update the plan's entry in the monitoring object

Implementation evidence:
`src/plugins/plan/inspector/components/PlanExecutionMonitoringView.vue`.
