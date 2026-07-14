# Open MCT reverse-engineered software requirements

## Baseline and status

This requirement set records the observable software behaviour implemented by Open Mission
Control Technologies (Open MCT) at source revision
[`a4aae41afd9d62db3490abbd49ed6b525940506e`](https://github.com/nasa/openmct/tree/a4aae41afd9d62db3490abbd49ed6b525940506e),
dated 2026-06-22. The package identifies this revision as version `4.2.0-next`.

The requirement set is an as-implemented baseline. It does not state planned behaviour,
business rationale, mission-specific policy, or quantities that the implementation does not
establish.

## Scope

The requirement set covers:

- the application lifecycle and plugin extension mechanism;
- every public API area instantiated by `src/MCT.js`;
- every first-level plugin directory under `src/plugins`;
- observable domain-object, telemetry, time, visualization, planning, notebook, persistence,
  and operational-awareness behaviour;
- the user-interface infrastructure that exposes those capabilities; and
- compatibility, accessibility, security, build, and performance constraints expressed by
  configuration or executable tests.

The example integrations under `example` provide evidence for extension contracts. Their
generated sample data and mission-specific fixture values are not Open MCT product
requirements. Test harnesses and repository-maintenance scripts are evidence or development
infrastructure rather than end-user behaviour.

The source-coverage assignment in [source-coverage.md](source-coverage.md) accounts for each
runtime source area and each shipped plugin area in the baseline.

## Requirement hierarchy

Each capability document contains two levels:

- `L1` identifies a high-level product outcome for the capability.
- `L2` identifies one independently verifiable obligation that refines an `L1` requirement.

Identifiers use `OMCT-CNN-L1-NN` and `OMCT-CNN-L2-NN.NN`, where `CNN` is the capability
number. Identifiers remain stable within this baseline.

Every `L2` requirement contains acceptance criteria in the following form:

- **GIVEN** establishes preconditions.
- **WHEN** identifies the stimulus.
- **THEN** identifies the observable result.

The normative statement and the `THEN` clause use *shall*. Each evidence entry names a path
within the pinned Open MCT revision. Unit and end-to-end specifications support behaviour;
runtime source remains the authority when the two differ.

## Capability index

| Capability | Requirements |
|---|---|
| C01 — Application lifecycle and extensibility | [C01](C01-application-lifecycle-and-extensibility.md) |
| C02 — Domain objects, types, composition, and discovery | [C02](C02-domain-objects-composition-and-discovery.md) |
| C03 — Object authoring and data portability | [C03](C03-object-authoring-and-data-portability.md) |
| C04 — Persistence and synchronization | [C04](C04-persistence-and-synchronization.md) |
| C05 — Time coordination and time utilities | [C05](C05-time-coordination.md) |
| C06 — Telemetry integration and processing | [C06](C06-telemetry-integration-and-processing.md) |
| C07 — Plot and chart visualization | [C07](C07-plot-and-chart-visualization.md) |
| C08 — Tabular, gauge, and datum visualization | [C08](C08-tabular-gauge-and-datum-visualization.md) |
| C09 — Layout and embedded-content presentation | [C09](C09-layout-and-content-presentation.md) |
| C10 — Conditions, derived telemetry, and filtering | [C10](C10-conditions-derived-telemetry-and-filtering.md) |
| C11 — Imagery visualization and interaction | [C11](C11-imagery.md) |
| C12 — Planning, timelines, events, and activities | [C12](C12-planning-timelines-and-events.md) |
| C13 — Notebooks and annotations | [C13](C13-notebooks-and-annotations.md) |
| C14 — Operational awareness and collaboration | [C14](C14-operational-awareness.md) |
| C15 — User-interface shell and interaction services | [C15](C15-user-interface-shell.md) |
| C16 — Compatibility, accessibility, security, and delivery | [C16](C16-quality-and-delivery.md) |

## Documentation conventions

This requirement set is a focused software specification, not an architecture description
and not a claim of conformance to ISO/IEC/IEEE 42010:2022. Its prose follows the vocabulary,
voice, normative-force, expression, and set-consistency rules of the
[Architecture Description Style Guide](https://github.com/QuinntyneBrown/architecture-description-style-guide/tree/952769665dd43d570c1c50f47d934d0ccd11c296).
The guide provides no software-requirement template, so the hierarchy and acceptance-criteria
structure defined in this index serves as the local template.

