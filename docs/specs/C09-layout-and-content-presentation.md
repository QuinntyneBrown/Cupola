# C09 — Layout and embedded-content presentation

## OMCT-C09-L1-01 — Display-layout canvas

Open MCT shall provide an editable canvas that positions and styles composed object views.

### OMCT-C09-L2-01.01 — Display-layout type and view

Open MCT shall provide a creatable display-layout object and its canvas view.

Acceptance criteria:

- **GIVEN** the baseline plugin set
- **WHEN** an operator creates and navigates to a display layout
- **THEN** Open MCT shall render its configured canvas and contained view items

Implementation evidence: `src/plugins/displayLayout/plugin.js`,
`src/plugins/displayLayout/pluginSpec.js`.

### OMCT-C09-L2-01.02 — Composition and item synchronization

Open MCT shall keep display-layout composition synchronized with its layout-item
configuration.

Acceptance criteria:

- **GIVEN** a display layout whose composition or item configuration changes
- **WHEN** the view processes the change
- **THEN** Open MCT shall add or remove the corresponding configuration or composition entry

Implementation evidence: `src/plugins/displayLayout/components/DisplayLayout.vue`,
`src/plugins/displayLayout/pluginSpec.js`.

### OMCT-C09-L2-01.03 — Item geometry

Open MCT shall persist item position, dimensions, rotation, and stacking order from edit
interactions.

Acceptance criteria:

- **GIVEN** a display layout in edit mode with selected items
- **WHEN** the operator moves, resizes, rotates, aligns, distributes, or reorders them
- **THEN** Open MCT shall save the resulting item geometry and stacking configuration

Implementation evidence: `src/plugins/displayLayout/components/DisplayLayout.vue`,
`src/plugins/displayLayout/DisplayLayoutToolbar.js`.

### OMCT-C09-L2-01.04 — Embedded object view selection

Open MCT shall render each layout item with its configured applicable object view.

Acceptance criteria:

- **GIVEN** a layout item that identifies a domain object and view key
- **WHEN** the layout renders
- **THEN** Open MCT shall instantiate the applicable view for that object within the item's
  bounds

Implementation evidence: `src/plugins/displayLayout/components/SubobjectView.vue`,
`src/plugins/displayLayout/plugin.js`.

### OMCT-C09-L2-01.05 — Clipboard transfer

Open MCT shall copy and paste eligible display-layout items through its layout clipboard.

Acceptance criteria:

- **GIVEN** selected display-layout items in edit mode
- **WHEN** the operator copies and pastes them
- **THEN** Open MCT shall create copied item configuration with valid object references

Implementation evidence: `src/plugins/displayLayout/actions/CopyToClipboardAction.js`,
`src/plugins/displayLayout/components/DisplayLayout.vue`.

## OMCT-C09-L1-02 — Flexible layouts

Open MCT shall provide a resizable pane layout for composed object views.

### OMCT-C09-L2-02.01 — Flexible-layout rendering

Open MCT shall render configured flexible-layout containers and contained object views.

Acceptance criteria:

- **GIVEN** a flexible-layout object with child composition
- **WHEN** its view renders
- **THEN** Open MCT shall place each configured child in its assigned pane

Implementation evidence: `src/plugins/flexibleLayout/flexibleLayoutViewProvider.js`,
`src/plugins/flexibleLayout/components/FlexibleLayout.vue`.

### OMCT-C09-L2-02.02 — Pane editing

Open MCT shall add, remove, orient, and resize flexible-layout panes through edit controls.

Acceptance criteria:

- **GIVEN** a flexible layout in edit mode
- **WHEN** the operator invokes an available pane toolbar control
- **THEN** Open MCT shall update and persist the layout configuration

Implementation evidence: `src/plugins/flexibleLayout/toolbarProvider.js`,
`src/plugins/flexibleLayout/pluginSpec.js`.

### OMCT-C09-L2-02.03 — Flexible-layout style configuration

Open MCT shall apply saved background, border, and text styles to flexible-layout elements.

Acceptance criteria:

- **GIVEN** a flexible layout with style properties
- **WHEN** the layout renders
- **THEN** Open MCT shall apply the configured styles to their target elements

Implementation evidence: `src/plugins/flexibleLayout/components/FlexibleLayout.vue`,
`e2e/tests/functional/plugins/styling/flexLayoutStyling.e2e.spec.js`.

## OMCT-C09-L1-03 — Tabs and folders

Open MCT shall provide alternate presentation of composed objects as tabs, a grid, or a
list.

### OMCT-C09-L2-03.01 — Tab per child

Open MCT shall render one tab for each composed child of a tabs object.

Acceptance criteria:

- **GIVEN** a tabs object with composed children
- **WHEN** its view renders
- **THEN** Open MCT shall display one selectable tab per child and the active child's view

Implementation evidence: `src/plugins/tabs/components/TabsComponent.vue`,
`src/plugins/tabs/pluginSpec.js`.

### OMCT-C09-L2-03.02 — Tab view retention

Open MCT shall retain inactive tab views only when eager loading or keep-alive behaviour is
enabled.

Acceptance criteria:

- **GIVEN** a tabs object with multiple child views
- **WHEN** the active tab changes
- **THEN** Open MCT shall retain or destroy inactive views according to its saved loading
  policy

Implementation evidence: `src/plugins/tabs/components/TabsComponent.vue`,
`src/plugins/tabs/pluginSpec.js`.

### OMCT-C09-L2-03.03 — Empty tabs state

Open MCT shall display an empty-state message when a tabs object has no composed children.

Acceptance criteria:

- **GIVEN** an empty tabs object
- **WHEN** its view renders
- **THEN** Open MCT shall display the configured empty-state message

Implementation evidence: `src/plugins/tabs/components/TabsComponent.vue`,
`src/plugins/tabs/pluginSpec.js`.

### OMCT-C09-L2-03.04 — Folder grid and list

Open MCT shall render every folder child in selectable grid and list views.

Acceptance criteria:

- **GIVEN** a folder with composed children
- **WHEN** the operator selects the grid or list view
- **THEN** Open MCT shall render each child in the selected presentation

Implementation evidence: `src/plugins/folderView/FolderGridView.js`,
`src/plugins/folderView/FolderListView.js`, `src/plugins/folderView/pluginSpec.js`.

## OMCT-C09-L1-04 — Linked and embedded web content

Open MCT shall present configured web destinations as links, buttons, or embedded pages.

### OMCT-C09-L2-04.01 — Hyperlink presentation

Open MCT shall render a hyperlink object as a text link or button according to its
configuration.

Acceptance criteria:

- **GIVEN** a hyperlink object with a valid URL and display configuration
- **WHEN** its view renders
- **THEN** Open MCT shall display the configured label using the selected link or button
  presentation

Implementation evidence: `src/plugins/hyperlink/HyperlinkLayout.vue`,
`src/plugins/hyperlink/pluginSpec.js`.

### OMCT-C09-L2-04.02 — Hyperlink target

Open MCT shall open a hyperlink destination in the configured current-tab or new-tab
target.

Acceptance criteria:

- **GIVEN** a rendered hyperlink object
- **WHEN** the operator activates it
- **THEN** Open MCT shall navigate using its saved target behaviour

Implementation evidence: `src/plugins/hyperlink/HyperlinkProvider.js`,
`src/plugins/hyperlink/pluginSpec.js`.

### OMCT-C09-L2-04.03 — Web-page embedding

Open MCT shall embed a configured web page in a dedicated object view.

Acceptance criteria:

- **GIVEN** a web-page object with a valid URL
- **WHEN** its view renders
- **THEN** Open MCT shall create the embedded page frame for that URL

Implementation evidence: `src/plugins/webPage/components/WebPage.vue`,
`src/plugins/webPage/pluginSpec.js`.
