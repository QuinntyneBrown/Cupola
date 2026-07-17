import { expect, test } from '../support/cupola.fixture';

const GAUGE = 'browse/mine/tables-lab/array-gauge';

const FORMS = [
  'filled-dial',
  'needle-dial',
  'vertical-meter',
  'vertical-meter-inverted',
  'horizontal-meter',
];

test.describe('C08 L1-03 — Gauge visualization', () => {
  test(
    'OMCT-C08-L2-03.01 — renders each of the five gauge forms selected from the inspector',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-03.01' }] },
    async ({ shell, telemetryTable, inspector, page }) => {
      await shell.goto(GAUGE);
      await expect(telemetryTable.gauge).toBeVisible();
      await inspector.openTab('gauge-options');

      for (const form of FORMS) {
        await page.getByTestId('gauge-opt-form').selectOption(form);
        await expect(telemetryTable.gaugeForm).toHaveAttribute('data-form', form);
      }
    },
  );

  test(
    'OMCT-C08-L2-03.02 — updates the displayed value from the latest datum',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-03.02' }] },
    async ({ shell, telemetryTable, realtime }) => {
      await shell.goto(GAUGE);
      await expect(telemetryTable.gauge).toBeVisible();

      await realtime.pushTelemetry('pwr.array_out', 63.5);
      await expect(telemetryTable.gaugeValue).toContainText('63.5');
    },
  );

  test(
    'OMCT-C08-L2-03.03 — telemetry-derived limits differ from manual bounds',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-03.03' }] },
    async ({ shell, inspector, page }) => {
      await shell.goto(GAUGE);
      // The fixture gauge derives its scale from telemetry limits, so limit markers render.
      await expect(page.getByTestId('gauge-mark-high')).toBeVisible();

      // Switching to manual bounds (no configured limits) removes the derived markers.
      await inspector.openTab('gauge-options');
      await page.getByTestId('gauge-opt-boundsmode').selectOption('manual');
      await expect(page.getByTestId('gauge-mark-high')).toHaveCount(0);
    },
  );
});
