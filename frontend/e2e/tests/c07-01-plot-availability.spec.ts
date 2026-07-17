import { expect, test } from '../support/cupola.fixture';

test.describe('C07 L1-01 — Time-series plot availability', () => {
  test(
    'OMCT-C07-L2-01.01 — a numeric telemetry object offers the plot view',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-01.01' }] },
    async ({ shell, plot }) => {
      await shell.goto('browse/station/power/pwr.bus_v');
      await expect(plot.view).toBeVisible();
      await expect(plot.seriesLines.first()).toBeVisible();
    },
  );

  test(
    'OMCT-C07-L2-01.02 — an imagery telemetry object is not offered the plot view',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-01.02' }] },
    async ({ shell, plot, page }) => {
      await shell.goto('browse/station/comms/cam.cupola');
      await expect(page.getByTestId('object-view')).toBeVisible();
      await expect(plot.view).toHaveCount(0);
    },
  );

  test(
    'OMCT-C07-L2-01.03 — an overlay plot renders its composed numeric series',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-01.03' }] },
    async ({ shell, plot }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');
      await expect(plot.view).toBeVisible();
      await expect(plot.seriesLines).toHaveCount(2);
    },
  );

  test(
    'OMCT-C07-L2-01.04 — a stacked plot renders eligible children as rows',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-01.04' }] },
    async ({ shell, plot }) => {
      await shell.goto('browse/mine/plots-lab/eclipse-stack');
      await expect(plot.view).toBeVisible();
      await expect(plot.stackedRows).toHaveCount(2);
    },
  );
});
