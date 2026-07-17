import { expect, test } from '../support/cupola.fixture';

const BAR = 'browse/mine/plots-lab/pdu-loads';
const SCATTER = 'browse/mine/plots-lab/iv-scatter';
const OVERLAY = 'browse/mine/station-displays/solar-array-output';

test.describe('C07 L1-04 — Specialized charts and configuration', () => {
  test(
    'OMCT-C07-L2-04.01 — a bar graph renders its eligible range-telemetry members',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-04.01' }] },
    async ({ shell, plot }) => {
      await shell.goto(BAR);
      await expect(plot.view).toBeVisible();
      await expect(plot.bars).toHaveCount(2);
    },
  );

  test(
    'OMCT-C07-L2-04.02 — scalar members render as bars and an array datum as spectral bins',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-04.02' }] },
    async ({ shell, plot, realtime }) => {
      await shell.goto(BAR);
      await expect(plot.bars).toHaveCount(2);

      // An array-valued datum on the first member becomes a spectral series of bins;
      // the second member stays a single scalar bar (4 + 1).
      await realtime.pushTelemetry('pwr.array_out', 0, undefined, { spectrum: [1, 2, 3, 4] });
      await expect(plot.bars).toHaveCount(5);
    },
  );

  test(
    'OMCT-C07-L2-04.03/04.04 — a scatter plot positions points from two range keys with named axes',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-04.04' }] },
    async ({ shell, plot, realtime }) => {
      await shell.goto(SCATTER);
      await expect(plot.view).toBeVisible();

      await realtime.pushTelemetry('pwr-iv', 3, undefined, { current: 3, voltage: 28 });
      await realtime.pushTelemetry('pwr-iv', 4, undefined, { current: 4, voltage: 30 });
      await realtime.pushTelemetry('pwr-iv', 5, undefined, { current: 5, voltage: 31 });
      await expect(plot.scatterPoints).toHaveCount(3);

      await expect(plot.page.getByTestId('scatter-x-title')).toContainText('current');
      await expect(plot.page.getByTestId('scatter-y-title')).toContainText('voltage');
    },
  );

  test(
    'OMCT-C07-L2-04.05 — an inspector option persists to configuration and survives reload',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-04.05' }] },
    async ({ shell, plot, inspector, page }) => {
      await shell.goto(OVERLAY);
      await expect(plot.seriesLines).toHaveCount(2);
      await inspector.openTab('plot-series');

      const save = page.waitForRequest(
        (request) =>
          request.method() === 'POST' && (request.postData() ?? '').includes('yAxisMode'),
      );
      await plot.yAxisOption('per-series').click();
      const body = (await save).postData() ?? '';
      expect(body).toContain('per-series');

      // Reflected in the open plot.
      await expect(plot.seriesAxes).toHaveCount(2);

      // Survives a reload.
      await shell.goto(OVERLAY);
      await expect(plot.seriesAxes).toHaveCount(2);
    },
  );
});
