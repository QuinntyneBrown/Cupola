# Source coverage

## Coverage method

The coverage assignment maps every first-level runtime area to one primary capability.
Cross-cutting source files may support requirements in more than one capability. A mapped
area proves that its implemented product behaviour was considered; the evidence entries in
the capability documents identify the files that support individual requirements.

## Core source areas

| Open MCT source area | Primary capability |
|---|---|
| `openmct.js`, `src/MCT.js` | C01 — Application lifecycle and extensibility |
| `src/api/actions` | C03 — Object authoring and data portability |
| `src/api/annotation` | C13 — Notebooks and annotations |
| `src/api/composition` | C02 — Domain objects, types, composition, and discovery |
| `src/api/faultmanagement` | C14 — Operational awareness and collaboration |
| `src/api/forms` | C15 — User-interface shell and interaction services |
| `src/api/indicators` | C14 — Operational awareness and collaboration |
| `src/api/menu` | C15 — User-interface shell and interaction services |
| `src/api/notifications` | C14 — Operational awareness and collaboration |
| `src/api/objects` | C02 — Domain objects, types, composition, and discovery |
| `src/api/overlays` | C15 — User-interface shell and interaction services |
| `src/api/priority` | C14 — Operational awareness and collaboration |
| `src/api/status` | C14 — Operational awareness and collaboration |
| `src/api/telemetry` | C06 — Telemetry integration and processing |
| `src/api/time` | C05 — Time coordination and time utilities |
| `src/api/tooltips` | C15 — User-interface shell and interaction services |
| `src/api/types` | C02 — Domain objects, types, composition, and discovery |
| `src/api/user` | C14 — Operational awareness and collaboration |
| `src/api/Branding.js`, `src/api/Editor.js`, `src/api/api.js` | C01, C03, and C15 |
| `src/exporters` | C03 — Object authoring and data portability |
| `src/images` | C15 — User-interface shell and interaction services |
| `src/selection` | C15 — User-interface shell and interaction services |
| `src/styles` | C15 — User-interface shell and interaction services |
| `src/tools`, `src/utils` | C15 and C16 |
| `src/ui` | C15 — User-interface shell and interaction services |

## Plugin source areas

| `src/plugins` area | Primary capability |
|---|---|
| `activityStates` | C12 — Planning, timelines, events, and activities |
| `autoflow` | C08 — Tabular, gauge, and datum visualization |
| `charts` | C07 — Plot and chart visualization |
| `clearData` | C03 — Object authoring and data portability |
| `clock` | C05 — Time coordination and time utilities |
| `comps` | C10 — Conditions, derived telemetry, and filtering |
| `condition` | C10 — Conditions, derived telemetry, and filtering |
| `conditionWidget` | C10 — Conditions, derived telemetry, and filtering |
| `correlationTelemetryPlugin` | C10 — Conditions, derived telemetry, and filtering |
| `CouchDBSearchFolder` | C04 — Persistence and synchronization |
| `defaultRootName` | C02 — Domain objects, types, composition, and discovery |
| `DeviceClassifier` | C15 — User-interface shell and interaction services |
| `displayLayout` | C09 — Layout and embedded-content presentation |
| `duplicate` | C03 — Object authoring and data portability |
| `events` | C12 — Planning, timelines, events, and activities |
| `exportAsJSONAction` | C03 — Object authoring and data portability |
| `faultManagement` | C14 — Operational awareness and collaboration |
| `filters` | C10 — Conditions, derived telemetry, and filtering |
| `flexibleLayout` | C09 — Layout and embedded-content presentation |
| `folderView` | C09 — Layout and embedded-content presentation |
| `formActions` | C03 — Object authoring and data portability |
| `gauge` | C08 — Tabular, gauge, and datum visualization |
| `goToOriginalAction` | C03 — Object authoring and data portability |
| `hyperlink` | C09 — Layout and embedded-content presentation |
| `imagery` | C11 — Imagery visualization and interaction |
| `importFromJSONAction` | C03 — Object authoring and data portability |
| `inspectorDataVisualization` | C15 — User-interface shell and interaction services |
| `inspectorViews` | C15 — User-interface shell and interaction services |
| `interceptors` | C02 — Domain objects, types, composition, and discovery |
| `ISOTimeFormat` | C05 — Time coordination and time utilities |
| `LADTable` | C08 — Tabular, gauge, and datum visualization |
| `latestDataClock` | C05 — Time coordination and time utilities |
| `licenses` | C16 — Compatibility, accessibility, security, and delivery |
| `linkAction` | C03 — Object authoring and data portability |
| `localStorage` | C04 — Persistence and synchronization |
| `localTimeSystem` | C05 — Time coordination and time utilities |
| `move` | C03 — Object authoring and data portability |
| `myItems` | C02 — Domain objects, types, composition, and discovery |
| `newFolderAction` | C03 — Object authoring and data portability |
| `notebook` | C13 — Notebooks and annotations |
| `notificationIndicator` | C14 — Operational awareness and collaboration |
| `objectMigration` | C04 — Persistence and synchronization |
| `openInNewTabAction` | C03 — Object authoring and data portability |
| `operatorStatus` | C14 — Operational awareness and collaboration |
| `performanceIndicator` | C14 — Operational awareness and collaboration |
| `persistence` | C04 — Persistence and synchronization |
| `plan` | C12 — Planning, timelines, events, and activities |
| `planExecutionMonitoring` | C12 — Planning, timelines, events, and activities |
| `plot` | C07 — Plot and chart visualization |
| `reloadAction` | C03 — Object authoring and data portability |
| `remoteClock` | C05 — Time coordination and time utilities |
| `remove` | C03 — Object authoring and data portability |
| `staticRootPlugin` | C04 — Persistence and synchronization |
| `summaryWidget` | C10 — Conditions, derived telemetry, and filtering |
| `tabs` | C09 — Layout and embedded-content presentation |
| `telemetryMean` | C10 — Conditions, derived telemetry, and filtering |
| `telemetryTable` | C08 — Tabular, gauge, and datum visualization |
| `themes` | C15 — User-interface shell and interaction services |
| `timeConductor` | C05 — Time coordination and time utilities |
| `timeline` | C12 — Planning, timelines, events, and activities |
| `timelist` | C12 — Planning, timelines, events, and activities |
| `timer` | C05 — Time coordination and time utilities |
| `URLIndicatorPlugin` | C14 — Operational awareness and collaboration |
| `URLTimeSettingsSynchronizer` | C05 — Time coordination and time utilities |
| `userIndicator` | C14 — Operational awareness and collaboration |
| `utcTimeSystem` | C05 — Time coordination and time utilities |
| `viewDatumAction` | C08 — Tabular, gauge, and datum visualization |
| `viewLargeAction` | C15 — User-interface shell and interaction services |
| `webPage` | C09 — Layout and embedded-content presentation |

## Verification evidence areas

| Evidence area | Use |
|---|---|
| `src/**/*Spec.js` | Unit-level behaviour and boundary conditions |
| `e2e/tests/functional` | Integrated product workflows |
| `e2e/tests/mobile` | Mobile viewport behaviour |
| `e2e/tests/performance` | Performance and memory contracts |
| `e2e/tests/visual-a11y` | Visual and accessibility contracts |
| `package.json`, `.webpack`, `.github` | Runtime compatibility, build, security, and delivery constraints |
