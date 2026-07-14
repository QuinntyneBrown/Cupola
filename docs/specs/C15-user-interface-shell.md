# C15 — User-interface shell and interaction services

## OMCT-C15-L1-01 — Navigation, routing, and selection

Open MCT shall coordinate browser hash routing, object navigation, and selected-object
state for the application shell.

### OMCT-C15-L2-01.01 — Hash route dispatch

Open MCT shall dispatch matching hash-path changes to registered route handlers and publish
route-change events.

Acceptance criteria:

- **GIVEN** a started application router with at least one registered route
- **WHEN** the hash path changes to a matching path
- **THEN** Open MCT shall update the current location, call the matching handler, abort
  active telemetry requests, and emit the path-change event

Implementation evidence: `src/ui/router/ApplicationRouter.js`,
`src/ui/router/ApplicationRouterSpec.js`.

### OMCT-C15-L2-01.02 — Search-parameter synchronization

Open MCT shall set, delete, and replace URL search parameters in the hash-relative
location.

Acceptance criteria:

- **GIVEN** a current hash-relative URL
- **WHEN** a caller sets, deletes, or replaces search parameters
- **THEN** Open MCT shall update the stored `URLSearchParams` representation and publish
  parameter changes

Implementation evidence: `src/ui/router/ApplicationRouter.js`,
`src/ui/router/ApplicationRouterSpec.js`.

### OMCT-C15-L2-01.03 — Browse path resolution

Open MCT shall resolve `/browse` object-path segments into domain objects and display the
selected object with an applicable view.

Acceptance criteria:

- **GIVEN** a browse URL containing one or more object identifiers
- **WHEN** browse navigation processes the route
- **THEN** Open MCT shall resolve the identifiers, update `router.path`, set the document
  title from the browsed object, observe object updates, and render the requested or
  preferred view when that view applies

Implementation evidence: `src/ui/router/Browse.js`,
`src/ui/router/ApplicationRouter.js`.

### OMCT-C15-L2-01.04 — Root browse redirect

Open MCT shall redirect a root `/browse` route to the last child returned by root
composition.

Acceptance criteria:

- **GIVEN** a root object whose composition returns at least one child
- **WHEN** the router handles `/browse`
- **THEN** Open MCT shall navigate to `/browse/{keyString}` for the last returned child

Implementation evidence: `src/ui/router/Browse.js`.

### OMCT-C15-L2-01.05 — Selection state

Open MCT shall maintain shell selection state and annotate selected elements.

Acceptance criteria:

- **GIVEN** selectable elements and selection contexts
- **WHEN** an element is selected or multi-selected
- **THEN** Open MCT shall update the selected collection, apply selected and selected-parent
  attributes, and emit the selection-change event

Implementation evidence: `src/selection/Selection.js`.

## OMCT-C15-L1-02 — View and inspector composition

Open MCT shall resolve application, inspector, and preview views from provider registries
and selection context.

### OMCT-C15-L2-02.01 — Object-view applicability

Open MCT shall return applicable object-view providers in descending priority order.

Acceptance criteria:

- **GIVEN** registered view providers and a domain object with an object path
- **WHEN** applicable views are requested
- **THEN** Open MCT shall return only providers whose `canView` result is true, ordered by
  descending provider priority

Implementation evidence: `src/ui/registries/ViewRegistry.js`.

### OMCT-C15-L2-02.02 — View lifecycle wrapping

Open MCT shall attach provider key and parent-element context to created object views.

Acceptance criteria:

- **GIVEN** a registered object-view provider
- **WHEN** the registry creates and shows a view from that provider
- **THEN** Open MCT shall expose the provider key on the view and record the view parent
  element before the provider show implementation runs

Implementation evidence: `src/ui/registries/ViewRegistry.js`.

### OMCT-C15-L2-02.03 — Inspector-view applicability

Open MCT shall return applicable inspector views in descending priority order.

Acceptance criteria:

- **GIVEN** registered inspector-view providers and a current selection
- **WHEN** inspector views are requested
- **THEN** Open MCT shall return only applicable inspector views with their key, name, and
  glyph metadata populated

Implementation evidence: `src/ui/registries/InspectorViewRegistry.js`,
`src/ui/inspector/InspectorViews.vue`.

### OMCT-C15-L2-02.04 — Standard inspector views

Open MCT shall provide properties, element, plot-element, style, and annotation inspector
views.

Acceptance criteria:

- **GIVEN** the standard inspector-views plugin
- **WHEN** the plugin installs
- **THEN** Open MCT shall register the properties, elements, plot elements, styles, and
  annotations inspector-view providers

Implementation evidence: `src/plugins/inspectorViews/plugin.js`,
`src/plugins/inspectorViews/properties/PropertiesViewProvider.js`,
`src/plugins/inspectorViews/elements/ElementsViewProvider.js`,
`src/plugins/inspectorViews/styles/StylesInspectorViewProvider.js`,
`src/plugins/inspectorViews/annotations/AnnotationsViewProvider.js`.

### OMCT-C15-L2-02.05 — Inspector data visualization

Open MCT shall expose compatible telemetry and imagery data visualization in the inspector.

Acceptance criteria:

- **GIVEN** the inspector data visualization plugin and a compatible selection
- **WHEN** the inspector resolves available views
- **THEN** Open MCT shall register and render the applicable numeric, imagery, or telemetry
  frame visualization

Implementation evidence: `src/plugins/inspectorDataVisualization/plugin.js`,
`src/plugins/inspectorDataVisualization/InspectorDataVisualizationViewProvider.js`,
`src/plugins/inspectorDataVisualization/NumericDataInspectorView.vue`,
`src/plugins/inspectorDataVisualization/ImageryInspectorView.vue`.

### OMCT-C15-L2-02.06 — View large overlay

Open MCT shall expand an embedded object view into a large overlay when the view supports
expansion.

Acceptance criteria:

- **GIVEN** an embedded view with a parent element and applicable object path
- **WHEN** the large-view action runs
- **THEN** Open MCT shall mount a preview container in a large overlay and restore preview
  state when the overlay is destroyed

Implementation evidence: `src/plugins/viewLargeAction/viewLargeAction.js`,
`src/plugins/viewLargeAction/plugin.js`.

## OMCT-C15-L1-03 — Actions, menus, and toolbars

Open MCT shall expose context-sensitive commands through action collections, menus, and
toolbar providers.

### OMCT-C15-L2-03.01 — Action registration and lookup

Open MCT shall register actions and return relevant actions for object paths and views.

Acceptance criteria:

- **GIVEN** registered actions with applicability functions
- **WHEN** an action collection is requested for an object path and optional view
- **THEN** Open MCT shall return an action collection containing the applicable registered
  actions

Implementation evidence: `src/api/actions/ActionsAPI.js`,
`src/api/actions/ActionsAPISpec.js`.

### OMCT-C15-L2-03.02 — Action collection state

Open MCT shall support enabling, disabling, hiding, showing, and status-bar filtering of
actions.

Acceptance criteria:

- **GIVEN** an action collection containing visible and status-bar actions
- **WHEN** an action is disabled, enabled, hidden, or shown
- **THEN** Open MCT shall update visible-action and status-bar-action results accordingly

Implementation evidence: `src/api/actions/ActionCollection.js`,
`src/api/actions/ActionCollectionSpec.js`.

### OMCT-C15-L2-03.03 — Context menu execution

Open MCT shall display menu actions at a requested screen location and invoke the selected
action callback.

Acceptance criteria:

- **GIVEN** menu actions and a screen coordinate
- **WHEN** a menu item is clicked
- **THEN** Open MCT shall invoke that item's callback and dismiss the menu

Implementation evidence: `src/api/menu/MenuAPI.js`, `src/api/menu/MenuAPISpec.js`,
`src/api/menu/menu.js`.

### OMCT-C15-L2-03.04 — Super menu descriptions and placement

Open MCT shall display super-menu descriptions and position menus according to placement
options.

Acceptance criteria:

- **GIVEN** menu actions with descriptions and a configured placement
- **WHEN** the super menu renders and a menu item receives pointer focus
- **THEN** Open MCT shall display that item's description and position the menu according
  to the placement calculation

Implementation evidence: `src/api/menu/MenuAPI.js`, `src/api/menu/MenuAPISpec.js`,
`src/api/menu/components/SuperMenu.vue`.

### OMCT-C15-L2-03.05 — Toolbar aggregation

Open MCT shall aggregate toolbar controls from providers that apply to the current
selection.

Acceptance criteria:

- **GIVEN** registered toolbar providers and a selection
- **WHEN** toolbar structure is requested
- **THEN** Open MCT shall concatenate controls from each provider whose selection predicate
  is true

Implementation evidence: `src/ui/registries/ToolbarRegistry.js`,
`src/ui/toolbar/ToolbarContainer.vue`.

## OMCT-C15-L1-04 — Forms, overlays, and tooltips

Open MCT shall provide reusable shell services for forms, modal overlays, selections,
progress feedback, and tooltips.

### OMCT-C15-L2-04.01 — Default form controls

Open MCT shall provide default form controls for autocomplete, checkbox, composite,
datetime, file input, locator, number, select, textarea, text, and toggle switch fields.

Acceptance criteria:

- **GIVEN** a constructed form API
- **WHEN** a caller requests each default control by name
- **THEN** Open MCT shall return a control provider with show and destroy functions

Implementation evidence: `src/api/forms/FormController.js`,
`src/api/forms/FormsAPISpec.js`.

### OMCT-C15-L2-04.02 — Custom form controls

Open MCT shall register caller-defined form controls by name.

Acceptance criteria:

- **GIVEN** a custom form control provider with show and destroy functions
- **WHEN** the provider is added under a new control name
- **THEN** Open MCT shall return that provider for the new control name

Implementation evidence: `src/api/forms/FormsAPI.js`, `src/api/forms/FormsAPISpec.js`.

### OMCT-C15-L2-04.03 — Form presentation

Open MCT shall render form structures in either a supplied element or an overlay dialog.

Acceptance criteria:

- **GIVEN** a form structure with rows and controls
- **WHEN** a custom form or overlay form is shown
- **THEN** Open MCT shall mount the form, collect changed values, and resolve or reject the
  returned promise when save or cancel occurs

Implementation evidence: `src/api/forms/FormsAPI.js`,
`src/api/forms/components/FormProperties.vue`.

### OMCT-C15-L2-04.04 — Overlay stack

Open MCT shall manage overlay, dialog, progress-dialog, and selection overlays as a stack.

Acceptance criteria:

- **GIVEN** one or more active overlays
- **WHEN** a new overlay appears or the last dismissible overlay is dismissed
- **THEN** Open MCT shall hide an auto-hide previous overlay, restore it when the new
  overlay is destroyed, and dismiss the last dismissible overlay on Escape

Implementation evidence: `src/api/overlays/OverlayAPI.js`,
`src/api/overlays/Overlay.js`, `src/api/overlays/Dialog.js`,
`src/api/overlays/ProgressDialog.js`, `src/api/overlays/Selection.js`.

### OMCT-C15-L2-04.05 — Tooltip lifecycle

Open MCT shall show only the active tooltip set and remove existing tooltips before a new
tooltip appears.

Acceptance criteria:

- **GIVEN** an active tooltip and a request for another tooltip
- **WHEN** the tooltip API shows the new tooltip
- **THEN** Open MCT shall destroy existing tooltips, show the new tooltip, and track it as
  active

Implementation evidence: `src/api/tooltips/ToolTipAPI.js`,
`src/api/tooltips/ToolTip.js`, `src/api/tooltips/components/TooltipComponent.vue`.

## OMCT-C15-L1-05 — Adaptive shell, theme, and branding

Open MCT shall adapt shell presentation through device classification, installable themes,
and branding settings.

### OMCT-C15-L2-05.01 — Device classification classes

Open MCT shall add body classes for detected device, orientation, and touch
characteristics.

Acceptance criteria:

- **GIVEN** an agent that reports mobile, phone, tablet, desktop, portrait, landscape, or
  touch characteristics
- **WHEN** the device classifier runs
- **THEN** Open MCT shall add body classes for matching characteristics and omit classes
  for nonmatching characteristics

Implementation evidence: `src/plugins/DeviceClassifier/src/DeviceClassifier.js`,
`src/plugins/DeviceClassifier/src/DeviceMatchers.js`,
`src/plugins/DeviceClassifier/src/DeviceClassifierSpec.js`.

### OMCT-C15-L2-05.02 — Theme installation

Open MCT shall install one active theme stylesheet for dark matter, espresso, or snow
themes.

Acceptance criteria:

- **GIVEN** an installed theme plugin
- **WHEN** the theme plugin runs
- **THEN** Open MCT shall remove any existing theme link and append the selected theme CSS
  link to the document head

Implementation evidence: `src/plugins/themes/installTheme.js`,
`src/plugins/themes/darkmatter.js`, `src/plugins/themes/espresso.js`,
`src/plugins/themes/snow.js`.

### OMCT-C15-L2-05.03 — Branding configuration

Open MCT shall expose configured branding options to shell components.

Acceptance criteria:

- **GIVEN** branding options containing a small logo image or about-dialog content
- **WHEN** shell components read branding options
- **THEN** Open MCT shall return the stored options for logo and about-dialog rendering

Implementation evidence: `src/api/Branding.js`, `src/ui/layout/AppLogo.vue`,
`src/ui/layout/AboutDialog.vue`.

### OMCT-C15-L2-05.04 — About dialog launch

Open MCT shall open the about dialog from the application logo.

Acceptance criteria:

- **GIVEN** the rendered application logo
- **WHEN** the logo is activated
- **THEN** Open MCT shall mount the about dialog in a large overlay with build and license
  information

Implementation evidence: `src/ui/layout/AppLogo.vue`, `src/ui/layout/AboutDialog.vue`.

### OMCT-C15-L2-05.05 — Shell search

Open MCT shall search objects and annotations from the global search user interface.

Acceptance criteria:

- **GIVEN** indexed objects, annotations, or both
- **WHEN** a search term is entered in the shell search field
- **THEN** Open MCT shall display matching object and annotation search results

Implementation evidence: `src/ui/layout/search/GrandSearch.vue`,
`src/ui/layout/search/GrandSearchSpec.js`,
`src/ui/layout/search/ObjectSearchResult.vue`,
`src/ui/layout/search/AnnotationSearchResult.vue`.

