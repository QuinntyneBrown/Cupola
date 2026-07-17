import { expect, test } from '../support/cupola.fixture';

const BUS_V = 'browse/station/power/pwr.bus_v';

test.describe('C07 L1-02 — Plot data rendering and navigation', () => {
  test(
    'OMCT-C07-L2-02.01 — the plot issues one historical request for the active bounds on mount',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-02.01' }] },
    async ({ shell, plot, page }) => {
      let requests = 0;
      page.on('request', (request) => {
        if (request.url().includes('/api/telemetry/pwr.bus_v')) {
          requests += 1;
        }
      });
      await shell.goto(BUS_V);
      await expect(plot.seriesLines.first()).toBeVisible();
      await page.waitForTimeout(300);
      expect(requests).toBe(1);
    },
  );

  test(
    'OMCT-C07-L2-02.02 — a subscribed datum is rendered on the plot',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-02.02' }] },
    async ({ shell, plot, realtime }) => {
      await shell.goto(BUS_V);
      await expect(plot.seriesLines.first()).toBeVisible();
      const before = await plot.seriesCount('pwr.bus_v');

      await realtime.pushTelemetry('pwr.bus_v', 55.5);
      await expect.poll(() => plot.seriesCount('pwr.bus_v')).toBe(before + 1);
    },
  );

  test(
    'OMCT-C07-L2-02.03 — the plot renders formatted axis ticks and labels',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-02.03' }] },
    async ({ shell, plot }) => {
      await shell.goto(BUS_V);
      await expect(plot.seriesLines.first()).toBeVisible();
      expect(await plot.xTicks.count()).toBeGreaterThan(1);
      expect(await plot.yTicks.count()).toBeGreaterThan(1);
      // Domain ticks carry an HH:mm[:ss] UTC label.
      await expect(plot.xTicks.first()).toHaveText(/\d{2}:\d{2}/);
    },
  );

  test(
    'OMCT-C07-L2-02.04 — the legend renders in collapsed and expanded modes',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-02.04' }] },
    async ({ shell, plot }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');
      await expect(plot.legend).toBeVisible();
      await expect(plot.legendKeys).toHaveCount(2);
      await expect(plot.legendTable).toHaveCount(0);

      await plot.legendToggle.click();
      await expect(plot.legendTable).toBeVisible();
    },
  );

  test(
    'OMCT-C07-L2-02.05 — pan and zoom update the bounds and re-request data',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-02.05' }] },
    async ({ shell, plot, page }) => {
      const initial = page.waitForRequest((request) =>
        request.url().includes('/api/telemetry/pwr.bus_v'),
      );
      await shell.goto(BUS_V);
      const initialUrl = new URL((await initial).url());
      const initialStart = initialUrl.searchParams.get('start');
      await expect(plot.seriesLines.first()).toBeVisible();

      const zoomed = page.waitForRequest((request) =>
        request.url().includes('/api/telemetry/pwr.bus_v'),
      );
      await plot.zoomIn.click();
      const zoomedUrl = new URL((await zoomed).url());
      expect(zoomedUrl.searchParams.get('start')).not.toBe(initialStart);
    },
  );

  test(
    'OMCT-C07-L2-02.06 — pause freezes the plot while telemetry keeps buffering, resume shows it',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-02.06' }] },
    async ({ shell, plot, realtime, page }) => {
      await shell.goto(BUS_V);
      await expect(plot.seriesLines.first()).toBeVisible();
      const before = await plot.seriesCount('pwr.bus_v');

      await plot.pause.click();
      await expect(plot.pausedChip).toBeVisible();

      await realtime.pushTelemetry('pwr.bus_v', 61);
      await page.waitForTimeout(300);
      // The rendered snapshot is frozen while paused.
      expect(await plot.seriesCount('pwr.bus_v')).toBe(before);

      await plot.pause.click();
      // On resume the buffered datum appears.
      await expect.poll(() => plot.seriesCount('pwr.bus_v')).toBe(before + 1);
    },
  );

  test(
    'OMCT-C07-L2-02.07 — enabling limit lines renders the lines and alarm-styled points',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-02.07' }] },
    async ({ shell, plot, inspector }) => {
      await shell.goto(BUS_V);
      await expect(plot.seriesLines.first()).toBeVisible();

      await inspector.openTab('plot-series');
      await inspector.section('plot-opt-limits').click();

      // Horizontal limit lines and alarm markers render as SVG primitives.
      await expect.poll(() => plot.limitLines.count()).toBeGreaterThan(0);
      await expect.poll(() => plot.alarmPoints.count()).toBeGreaterThan(0);
    },
  );
});
