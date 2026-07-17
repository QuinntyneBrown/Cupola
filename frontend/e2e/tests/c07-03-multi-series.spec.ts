import { expect, test } from '../support/cupola.fixture';

const OVERLAY = 'browse/mine/station-displays/solar-array-output';
const STACK = 'browse/mine/plots-lab/eclipse-stack';

test.describe('C07 L1-03 — Multi-series plot presentation', () => {
  test(
    'OMCT-C07-L2-03.01 — the overlay renders a single axis or per-series axes as configured',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-03.01' }] },
    async ({ shell, plot, inspector }) => {
      await shell.goto(OVERLAY);
      await expect(plot.seriesLines).toHaveCount(2);
      await expect(plot.seriesAxes).toHaveCount(0);

      await inspector.openTab('plot-series');
      await plot.yAxisOption('per-series').click();
      await expect(plot.seriesAxes).toHaveCount(2);
    },
  );

  test(
    'OMCT-C07-L2-03.02 — composition changes add and remove rendered stacked rows',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-03.02' }] },
    async ({ shell, plot, fakeBackend, realtime }) => {
      await shell.goto(STACK);
      await expect(plot.stackedRows).toHaveCount(2);

      const stack = fakeBackend.object('eclipse-stack');
      await realtime.pushObjectUpdate({
        ...stack,
        composition: ['solar-array-output', 'pwr.array_out', 'pwr.bus_v'],
      });
      await expect(plot.stackedRows).toHaveCount(3);

      await realtime.pushObjectUpdate({ ...stack, composition: ['pwr.array_out'] });
      await expect(plot.stackedRows).toHaveCount(1);
    },
  );

  test(
    'OMCT-C07-L2-03.03 — the cursor guide is coordinated across stacked rows',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-03.03' }] },
    async ({ shell, plot, page }) => {
      await shell.goto(STACK);
      await expect(plot.stackedRows).toHaveCount(2);

      await page.getByTestId('stacked-plot-svg').hover();
      // The single crosshair is a zero-width SVG line; assert it is rendered.
      await expect(plot.stackedCursor).toHaveCount(1);
      await expect(plot.stackedCursorPoints).toHaveCount(3);

      const xs = await plot.stackedCursorPoints.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('cx')),
      );
      expect(new Set(xs).size).toBe(1);
    },
  );

  test(
    'OMCT-C07-L2-03.04 — configured series styles render',
    { annotation: [{ type: 'requirement', description: 'OMCT-C07-L2-03.04' }] },
    async ({ shell, plot, inspector, page }) => {
      await shell.goto(OVERLAY);
      await expect(plot.seriesLines).toHaveCount(2);

      await inspector.openTab('plot-series');
      await plot.colorSwatch('pwr.array_out', 5).click();
      await page
        .locator('[data-testid="plot-series-linestyle"][data-key="pwr.array_out"]')
        .selectOption('dashed');

      await expect(plot.seriesLine('pwr.array_out')).toHaveAttribute('stroke', 'var(--cp-chart-5)');
      await expect(plot.seriesLine('pwr.array_out')).toHaveAttribute('stroke-dasharray', '6 4');
    },
  );
});
