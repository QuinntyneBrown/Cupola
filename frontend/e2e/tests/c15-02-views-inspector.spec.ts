import { expect, test } from '../support/cupola.fixture';

test.describe('C15 L1-02 — View and inspector composition', () => {
  test(
    'OMCT-C15-L2-02.01 — the highest-priority applicable object view renders by default',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-02.01' }] },
    async ({ shell, page }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');

      // Plot (priority 90) wins over table (60) for an overlay plot.
      await expect(page.getByTestId('plot-view')).toBeVisible();
      await expect(page.getByTestId('table-view')).toHaveCount(0);
    },
  );

  test(
    'OMCT-C15-L2-02.01 — the requested ?view= provider wins when applicable',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-02.01' }] },
    async ({ shell, page }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output?view=table');

      await expect(page.getByTestId('table-view')).toBeVisible();
      await expect(page.getByTestId('plot-view')).toHaveCount(0);
    },
  );

  test(
    'OMCT-C15-L2-02.03 — inspector tabs change with the current selection',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-02.03' }] },
    async ({ shell, inspector }) => {
      await shell.goto('browse/mine');
      // Folder selection: no plot-series tab.
      await expect(inspector.tab('properties')).toBeVisible();
      await expect(inspector.tab('plot-series')).toHaveCount(0);

      await shell.goto('browse/mine/station-displays/solar-array-output');
      // Overlay-plot selection: plot-series tab appears.
      await expect(inspector.tab('plot-series')).toBeVisible();
    },
  );

  test(
    'OMCT-C15-L2-02.04 — an overlay plot exposes properties, elements, plot-series, styles, and annotations',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-02.04' }] },
    async ({ shell, inspector }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');

      for (const key of ['properties', 'elements', 'plot-series', 'styles', 'annotations']) {
        await expect(inspector.tab(key)).toBeVisible();
      }

      await inspector.openTab('plot-series');
      await expect(inspector.section('plot-series-inspector')).toBeVisible();

      await inspector.openTab('annotations');
      await expect(inspector.section('annotations-inspector')).toBeVisible();
    },
  );

  test(
    'OMCT-C15-L2-02.05 — numeric and imagery data visualizations render by telemetry hint',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-02.05' }] },
    async ({ shell, inspector, realtime, page }) => {
      // Range telemetry → numeric data visualization.
      await shell.goto('browse/station/power/pwr.bus_v');
      await inspector.openTab('data-visualization');
      await expect(inspector.section('numeric-inspector')).toBeVisible();
      await realtime.pushTelemetry('pwr.bus_v', 120.4);
      await expect(page.getByTestId('numeric-value')).toContainText('120.40');

      // Image telemetry → imagery data visualization.
      await shell.goto('browse/station/comms/cam.cupola');
      await inspector.openTab('data-visualization');
      await expect(inspector.section('imagery-inspector')).toBeVisible();
    },
  );

  test(
    'OMCT-C15-L2-02.06 — the large-view action expands the view into an overlay dismissed by Escape',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-02.06' }] },
    async ({ shell, overlay, objectView, page }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');

      await page.getByTestId('expand-view').click();
      await expect(overlay.preview()).toBeVisible();
      await expect(overlay.containers).toHaveCount(1);

      await page.keyboard.press('Escape');
      await expect(overlay.preview()).toHaveCount(0);
      // The embedded view is intact after the overlay closes.
      await expect(objectView.title).toHaveText('Solar array output');
    },
  );
});
