# C11 — Imagery visualization and interaction

## OMCT-C11-L1-01 — Time-based imagery presentation

Open MCT shall present image telemetry as a focused image with navigable time history.

### OMCT-C11-L2-01.01 — Imagery applicability

Open MCT shall offer imagery views only for telemetry metadata containing an image hint.

Acceptance criteria:

- **GIVEN** a telemetry-producing domain object
- **WHEN** imagery view applicability is evaluated
- **THEN** Open MCT shall offer the view only when the metadata identifies an image value

Implementation evidence: `src/plugins/imagery/ImageryViewProvider.js`,
`src/plugins/imagery/pluginSpec.js`.

### OMCT-C11-L2-01.02 — Initial focused image

Open MCT shall focus the most recent image within the active time bounds when imagery loads.

Acceptance criteria:

- **GIVEN** image telemetry within the active bounds
- **WHEN** the imagery view mounts
- **THEN** Open MCT shall display the most recent returned image as the focused image

Implementation evidence: `src/plugins/imagery/components/ImageryView.vue`,
`src/plugins/imagery/pluginSpec.js`.

### OMCT-C11-L2-01.03 — Thumbnail selection

Open MCT shall focus an image selected from the image-history thumbnails.

Acceptance criteria:

- **GIVEN** an imagery history containing thumbnails
- **WHEN** the operator selects one thumbnail
- **THEN** Open MCT shall display the corresponding image and timestamp

Implementation evidence: `src/plugins/imagery/components/ImageThumbnail.vue`,
`src/plugins/imagery/pluginSpec.js`.

### OMCT-C11-L2-01.04 — Keyboard navigation

Open MCT shall navigate focused imagery through the implemented arrow-key controls.

Acceptance criteria:

- **GIVEN** a focused image with an adjacent history image
- **WHEN** the operator presses the applicable arrow key
- **THEN** Open MCT shall move focus to the adjacent image

Implementation evidence: `src/plugins/imagery/components/ImageryView.vue`,
`src/plugins/imagery/pluginSpec.js`.

### OMCT-C11-L2-01.05 — Time-strip imagery

Open MCT shall render image thumbnails that fall within a time-strip's bounds.

Acceptance criteria:

- **GIVEN** imagery composed into a time strip
- **WHEN** the strip loads or its bounds change
- **THEN** Open MCT shall show images in the new bounds and remove images outside them

Implementation evidence: `src/plugins/imagery/components/ImageryTimeView.vue`,
`src/plugins/imagery/pluginSpec.js`.

## OMCT-C11-L1-02 — Image inspection controls

Open MCT shall provide spatial and display controls for detailed image inspection.

### OMCT-C11-L2-02.01 — Zoom and pan

Open MCT shall zoom a focused image around the interaction point and pan it while zoomed.

Acceptance criteria:

- **GIVEN** a focused image
- **WHEN** the operator uses supported zoom and pan interactions
- **THEN** Open MCT shall update the image scale and translation within implemented bounds

Implementation evidence: `src/plugins/imagery/components/ImageControls.vue`,
`src/plugins/imagery/components/ImageryView.vue`.

### OMCT-C11-L2-02.02 — Viewable-area indicator

Open MCT shall display the current viewable image area when zoom exceeds one.

Acceptance criteria:

- **GIVEN** an image zoom factor greater than one
- **WHEN** the imagery view renders
- **THEN** Open MCT shall display the viewable-area indicator for the current pan position

Implementation evidence: `src/plugins/imagery/components/ImageryView.vue`,
`src/plugins/imagery/pluginSpec.js`.

### OMCT-C11-L2-02.03 — Brightness and contrast

Open MCT shall apply adjustable brightness and contrast filters to the focused image.

Acceptance criteria:

- **GIVEN** a focused image
- **WHEN** the operator changes brightness or contrast
- **THEN** Open MCT shall update the image filter and restore both values to 100 percent on
  reset

Implementation evidence: `src/plugins/imagery/components/FilterSettings.vue`,
`src/plugins/imagery/pluginSpec.js`.

### OMCT-C11-L2-02.04 — Image layers

Open MCT shall render and persist visibility for image layers declared by metadata.

Acceptance criteria:

- **GIVEN** image metadata with named layers
- **WHEN** the operator toggles a layer
- **THEN** Open MCT shall update the visible overlays and save the layer visibility when the
  object supports mutation

Implementation evidence: `src/plugins/imagery/components/LayerSettings.vue`,
`src/plugins/imagery/components/ImageryView.vue`.

### OMCT-C11-L2-02.05 — Compass overlays

Open MCT shall display compass rose and heads-up overlays when required orientation metadata
is available.

Acceptance criteria:

- **GIVEN** a focused image with heading and camera-angle information
- **WHEN** the compass component renders
- **THEN** Open MCT shall display the compass rose and heads-up display in the calculated
  orientation

Implementation evidence: `src/plugins/imagery/components/Compass/CompassComponent.vue`,
`src/plugins/imagery/components/Compass/pluginSpec.js`.

## OMCT-C11-L1-03 — Image context and annotations

Open MCT shall associate imagery with related telemetry and pixel-spatial annotations.

### OMCT-C11-L2-03.01 — Related telemetry

Open MCT shall retrieve the latest configured related telemetry at a focused image's time.

Acceptance criteria:

- **GIVEN** image metadata that identifies related historical telemetry
- **WHEN** the focused image changes
- **THEN** Open MCT shall request and expose the related values at or before the image time

Implementation evidence: `src/plugins/imagery/components/RelatedTelemetry/RelatedTelemetry.js`,
`src/plugins/imagery/components/ImageryView.vue`.

### OMCT-C11-L2-03.02 — Pixel-spatial annotation display

Open MCT shall display existing pixel-spatial annotations over their targeted image.

Acceptance criteria:

- **GIVEN** annotations targeting image coordinates and timestamp
- **WHEN** that image is focused
- **THEN** Open MCT shall render the annotation rectangles at the stored normalized
  coordinates

Implementation evidence: `src/plugins/imagery/components/AnnotationsCanvas.vue`,
`src/plugins/imagery/components/ImageryView.vue`.

### OMCT-C11-L2-03.03 — Pixel-spatial annotation selection

Open MCT shall select annotations intersecting a click or marquee region.

Acceptance criteria:

- **GIVEN** displayed image annotations
- **WHEN** the operator clicks an annotation or drags a selection region
- **THEN** Open MCT shall publish the intersecting annotations through application selection

Implementation evidence: `src/plugins/imagery/components/AnnotationsCanvas.vue`.

## OMCT-C11-L1-04 — Image extraction

Open MCT shall allow the focused image to be opened or saved outside the imagery view.

### OMCT-C11-L2-04.01 — Open image in new tab

Open MCT shall open the focused image in a new tab with opener isolation.

Acceptance criteria:

- **GIVEN** a focused image with a valid URL
- **WHEN** the open-image action runs
- **THEN** Open MCT shall open the URL in a new tab using `noopener` and `noreferrer`

Implementation evidence: `src/plugins/imagery/actions/OpenImageInNewTabAction.js`.

### OMCT-C11-L2-04.02 — Save image

Open MCT shall save the focused image through the browser download workflow.

Acceptance criteria:

- **GIVEN** a focused image
- **WHEN** the save-image action runs
- **THEN** Open MCT shall export the displayed image content with a derived filename

Implementation evidence: `src/plugins/imagery/actions/SaveImageAsAction.js`,
`src/exporters/ImageExporter.js`.

