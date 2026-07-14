# C16 — Compatibility, accessibility, security, and delivery

## OMCT-C16-L1-01 — Runtime compatibility and package distribution

Open MCT shall declare its runtime compatibility and publish browser-consumable package
entry points.

### OMCT-C16-L2-01.01 — Node runtime declaration

Open MCT shall declare Node.js `>=24.14.1` as the supported package runtime.

Acceptance criteria:

- **GIVEN** the Open MCT package metadata
- **WHEN** package engines are inspected
- **THEN** Open MCT shall declare the Node.js engine constraint as `>=24.14.1`

Implementation evidence: `package.json`.

### OMCT-C16-L2-01.02 — Browser target declaration

Open MCT shall declare support targets for Firefox ESR, the last two Chrome versions,
unreleased Chrome versions, iOS Safari 16 or later, and Safari 16 or later, while excluding
Internet Explorer 11.

Acceptance criteria:

- **GIVEN** the Open MCT package metadata
- **WHEN** browser targets are inspected
- **THEN** Open MCT shall list `Firefox ESR`, `not IE 11`, `last 2 Chrome versions`,
  `unreleased Chrome versions`, `ios_saf >= 16`, and `Safari >= 16`

Implementation evidence: `package.json`.

### OMCT-C16-L2-01.03 — Package entry points

Open MCT shall publish import, require, module, main, and type entry points for the built
package.

Acceptance criteria:

- **GIVEN** the built package metadata
- **WHEN** a package consumer resolves the package entry points
- **THEN** Open MCT shall resolve import and require entry points to `dist/openmct.js` and
  type declarations to `dist/types/index.d.ts`

Implementation evidence: `package.json`.

### OMCT-C16-L2-01.04 — Production distribution bundle

Open MCT shall build a UMD distribution with browser workers, theme CSS, copied favicons,
the transformed index page, and imagery-layer assets.

Acceptance criteria:

- **GIVEN** the production webpack configuration
- **WHEN** the production build runs
- **THEN** Open MCT shall emit the configured `openmct` UMD bundle, worker bundles, theme
  CSS assets, favicons, index page, and imagery layer assets into `dist`

Implementation evidence: `.webpack/webpack.common.mjs`, `.webpack/webpack.prod.mjs`.

### OMCT-C16-L2-01.05 — Script-relative asset path

Open MCT shall derive the webpack public path from the loaded `openmct.js` script URL when
that script URL is available.

Acceptance criteria:

- **GIVEN** a browser document whose current script URL ends with `/openmct.js`
- **WHEN** Open MCT initializes
- **THEN** Open MCT shall set the webpack public path to that script's containing
  directory

Implementation evidence: `openmct.js`.

## OMCT-C16-L1-02 — Build and verification gates

Open MCT shall define repeatable build, lint, unit, end-to-end, visual, accessibility,
performance, and memory verification commands.

### OMCT-C16-L2-02.01 — Build command

Open MCT shall build production assets and TypeScript declarations through the package build
script.

Acceptance criteria:

- **GIVEN** the package scripts
- **WHEN** the `build` script runs
- **THEN** Open MCT shall run the production webpack build and TypeScript compiler

Implementation evidence: `package.json`, `.webpack/webpack.prod.mjs`.

### OMCT-C16-L2-02.02 — Lint commands

Open MCT shall lint JavaScript, Vue, and spelling content through the package lint script.

Acceptance criteria:

- **GIVEN** the package scripts
- **WHEN** the `lint` script runs
- **THEN** Open MCT shall run the JavaScript lint, Vue lint, and spelling lint commands

Implementation evidence: `package.json`.

### OMCT-C16-L2-02.03 — Unit-test command

Open MCT shall execute unit tests through Karma and Jasmine.

Acceptance criteria:

- **GIVEN** the package scripts
- **WHEN** the `test` script runs
- **THEN** Open MCT shall start Karma with the repository Karma configuration

Implementation evidence: `package.json`, `karma.conf.cjs`.

### OMCT-C16-L2-02.04 — CI quality workflow

Open MCT shall run build, lint, unit, end-to-end, visual-accessibility, performance, and
memory jobs in the configured pull-request workflow.

Acceptance criteria:

- **GIVEN** a configured workflow event for the PR workflow
- **WHEN** the workflow executes
- **THEN** Open MCT shall run dependency build/cache, lint, unit-test, sharded e2e,
  visual-a11y, performance, and memory jobs

Implementation evidence: `.github/workflows/pr.yml`.

### OMCT-C16-L2-02.05 — Code scanning workflow

Open MCT shall run JavaScript CodeQL security-and-quality analysis on configured push,
pull-request, and weekly schedule events.

Acceptance criteria:

- **GIVEN** a configured CodeQL workflow event
- **WHEN** the workflow executes
- **THEN** Open MCT shall initialize CodeQL for JavaScript with security-and-quality
  queries, autobuild, and perform analysis

Implementation evidence: `.github/workflows/codeql-analysis.yml`,
`.github/codeql/codeql-config.yml`.

## OMCT-C16-L1-03 — Accessibility and mobile verification

Open MCT shall verify accessible and mobile shell behavior with automated browser tests.

### OMCT-C16-L2-03.01 — WCAG 2 AA axe scan

Open MCT shall scan visual-accessibility test pages for WCAG 2 AA axe violations.

Acceptance criteria:

- **GIVEN** a visual-accessibility test page
- **WHEN** the accessibility scan runs
- **THEN** Open MCT shall analyze the page with axe tags for `wcag2aa` and assert zero
  violations

Implementation evidence: `e2e/avpFixtures.js`,
`e2e/tests/visual-a11y/a11y.visual.spec.js`.

### OMCT-C16-L2-03.02 — Visual-accessibility coverage

Open MCT shall run visual-accessibility checks across default plugins, shell components,
search, notifications, planning, notebooks, telemetry views, gauges, imagery, and styling.

Acceptance criteria:

- **GIVEN** the visual-accessibility Playwright suite
- **WHEN** the suite runs
- **THEN** Open MCT shall execute the visual and accessibility scenarios under
  `e2e/tests/visual-a11y`

Implementation evidence: `e2e/tests/visual-a11y`,
`e2e/playwright-visual-a11y.config.js`.

### OMCT-C16-L2-03.03 — Accessibility failure artifacts

Open MCT shall write accessibility reports and screenshots when axe violations are found.

Acceptance criteria:

- **GIVEN** an accessibility scan with one or more violations
- **WHEN** the scan completes
- **THEN** Open MCT shall write a JSON accessibility report and screenshot under the
  Playwright test-results directory

Implementation evidence: `e2e/avpFixtures.js`.

### OMCT-C16-L2-03.04 — Mobile viewport smoke tests

Open MCT shall execute mobile smoke tests against iPad landscape and iPhone 14 Pro WebKit
projects.

Acceptance criteria:

- **GIVEN** the mobile Playwright configuration
- **WHEN** mobile tests run
- **THEN** Open MCT shall verify tree visibility, search navigation, time conductor editing,
  and removal confirmation in the configured mobile projects

Implementation evidence: `e2e/playwright-mobile.config.js`,
`e2e/tests/mobile/smoke.e2e.spec.js`.

## OMCT-C16-L1-04 — Content and navigation safety

Open MCT shall neutralize implemented unsafe content, navigation, and imported-data
patterns.

### OMCT-C16-L2-04.01 — URL sanitization

Open MCT shall sanitize configured URLs before rendering condition-widget, hyperlink,
web-page, and summary-widget destinations.

Acceptance criteria:

- **GIVEN** a domain object with a configured URL for a supported destination view
- **WHEN** the view renders the destination
- **THEN** Open MCT shall pass the URL through the configured URL sanitizer before assigning
  it to the rendered destination

Implementation evidence: `src/plugins/conditionWidget/components/ConditionWidget.vue`,
`src/plugins/hyperlink/HyperlinkLayout.vue`,
`src/plugins/webPage/components/WebPage.vue`,
`src/plugins/summaryWidget/src/SummaryWidget.js`.

### OMCT-C16-L2-04.02 — Rich-text sanitization

Open MCT shall sanitize notebook and annotation markdown-derived HTML before display or
search result rendering.

Acceptance criteria:

- **GIVEN** notebook text or annotation text that converts to HTML
- **WHEN** Open MCT renders the text or its search result
- **THEN** Open MCT shall sanitize the HTML according to the implemented sanitization
  schema or tag-stripping configuration

Implementation evidence: `src/plugins/notebook/components/NotebookEntry.vue`,
`src/ui/layout/search/AnnotationSearchResult.vue`,
`e2e/tests/functional/plugins/notebook/notebook.e2e.spec.js`.

### OMCT-C16-L2-04.03 — CSV formula neutralization

Open MCT shall neutralize exported CSV cell values that could be interpreted as spreadsheet
formulas.

Acceptance criteria:

- **GIVEN** an exported telemetry table row whose name begins with a formula-triggering
  pattern
- **WHEN** the CSV export is generated
- **THEN** Open MCT shall prefix the cell value according to the formula-injection
  neutralization rule

Implementation evidence: `src/exporters/CSVExporter.js`,
`src/plugins/telemetryTable/components/TableComponent.vue`,
`e2e/tests/functional/plugins/telemetryTable/telemetryTable.e2e.spec.js`.

### OMCT-C16-L2-04.04 — Prototype-pollution protection

Open MCT shall prevent `__proto__` payloads from polluting imported or local-storage domain
objects.

Acceptance criteria:

- **GIVEN** manipulated local storage or imported JSON containing `__proto__` properties
- **WHEN** Open MCT loads or imports the object
- **THEN** Open MCT shall produce a domain object without polluted prototype properties

Implementation evidence: `src/plugins/localStorage/pluginSpec.js`,
`src/plugins/importFromJSONAction/ImportFromJSONActionSpec.js`.

### OMCT-C16-L2-04.05 — New-tab opener isolation

Open MCT shall isolate opened browser tabs from their opener for object and imagery new-tab
actions.

Acceptance criteria:

- **GIVEN** an applicable object or image new-tab action
- **WHEN** the action opens a new browser tab
- **THEN** Open MCT shall open the tab with opener isolation options

Implementation evidence: `src/plugins/openInNewTabAction/openInNewTabAction.js`,
`src/plugins/imagery/actions/OpenImageInNewTabAction.js`.

### OMCT-C16-L2-04.06 — Image URL allow list

Open MCT shall block image new-tab navigation unless the image URL uses an implemented
allowed form.

Acceptance criteria:

- **GIVEN** an image view context with an image URL
- **WHEN** the image new-tab action runs
- **THEN** Open MCT shall open only safe absolute HTTP or HTTPS URLs, safe root-relative
  URLs, allowed non-SVG data-image URLs, or same-origin blob URLs

Implementation evidence: `src/plugins/imagery/actions/OpenImageInNewTabAction.js`.

### OMCT-C16-L2-04.07 — Image filename sanitization

Open MCT shall sanitize generated image-export filenames before download.

Acceptance criteria:

- **GIVEN** an image export filename containing unsupported characters or leading and
  trailing periods
- **WHEN** the image export runs
- **THEN** Open MCT shall remove unsupported characters and trim leading or trailing
  periods before saving

Implementation evidence: `src/exporters/ImageExporter.js`,
`src/exporters/ImageExporterSpec.js`.

## OMCT-C16-L1-05 — Performance and memory contracts

Open MCT shall define automated performance, contract, and memory-leak tests for supported
views and workflows.

### OMCT-C16-L2-05.01 — Production performance tests

Open MCT shall run non-contract performance tests against a production-mode server.

Acceptance criteria:

- **GIVEN** the production performance Playwright configuration
- **WHEN** production performance tests run
- **THEN** Open MCT shall start the production server and execute performance tests except
  contract tests

Implementation evidence: `e2e/playwright-performance-prod.config.js`,
`e2e/tests/performance`.

### OMCT-C16-L2-05.02 — Development contract performance tests

Open MCT shall run contract performance tests against a development-mode server with
performance marks available.

Acceptance criteria:

- **GIVEN** the development performance Playwright configuration
- **WHEN** contract performance tests run
- **THEN** Open MCT shall start the development server and execute contract performance
  specifications

Implementation evidence: `e2e/playwright-performance-dev.config.js`,
`e2e/tests/performance/contract/notebook.contract.perf.spec.js`,
`e2e/tests/performance/contract/imagery.contract.perf.spec.js`.

### OMCT-C16-L2-05.03 — Navigation memory-leak tests

Open MCT shall verify that supported views are garbage collected after navigation away.

Acceptance criteria:

- **GIVEN** the navigation memory-leak test data and Chrome memory project
- **WHEN** each configured view is opened and navigated away from
- **THEN** Open MCT shall complete the garbage-collection verification without detecting a
  retained root view object

Implementation evidence: `e2e/tests/performance/memory/navigation.memory.perf.spec.js`,
`e2e/test-data/memory-leak-detection.json`,
`e2e/playwright-performance-prod.config.js`.

### OMCT-C16-L2-05.04 — Tab rendering performance

Open MCT shall defer rendering of inactive tabbed content when tab visibility changes.

Acceptance criteria:

- **GIVEN** a tabs object with child views
- **WHEN** the active tab changes
- **THEN** Open MCT shall render tabbed elements only when they are visible according to
  the performance test

Implementation evidence: `e2e/tests/performance/tabs.perf.spec.js`.

### OMCT-C16-L2-05.05 — Plot tagging performance

Open MCT shall verify plot tagging interactions for overlay plots, telemetry plot views,
and stacked plots.

Acceptance criteria:

- **GIVEN** the plot tagging performance tests
- **WHEN** tagging scenarios run for supported plot presentations
- **THEN** Open MCT shall complete tag creation and display interactions under the
  performance test configuration

Implementation evidence: `e2e/tests/performance/tagging.perf.spec.js`.

## OMCT-C16-L1-06 — License and version disclosure

Open MCT shall disclose license, third-party license, and build-version information through
the application shell.

### OMCT-C16-L2-06.01 — About-dialog version information

Open MCT shall display version, build date, revision, and branch in the about dialog.

Acceptance criteria:

- **GIVEN** an application instance with build information
- **WHEN** the about dialog renders
- **THEN** Open MCT shall display version number, build date, revision, and branch fields

Implementation evidence: `src/ui/layout/AboutDialog.vue`, `.webpack/webpack.common.mjs`.

### OMCT-C16-L2-06.02 — About-dialog license text

Open MCT shall display Apache-2.0 license information in the about dialog.

Acceptance criteria:

- **GIVEN** the rendered about dialog
- **WHEN** license content is inspected
- **THEN** Open MCT shall display Apache-2.0 license information and a link to third-party
  licensing information

Implementation evidence: `src/ui/layout/AboutDialog.vue`.

### OMCT-C16-L2-06.03 — Third-party license route

Open MCT shall expose third-party license information through the `/licenses` route.

Acceptance criteria:

- **GIVEN** the licenses plugin
- **WHEN** the `/licenses` route is handled
- **THEN** Open MCT shall render the third-party licenses component in a full-screen
  nondismissible overlay

Implementation evidence: `src/plugins/licenses/plugin.js`,
`src/plugins/licenses/LicensesComponent.vue`,
`src/plugins/licenses/third-party-licenses.json`.

