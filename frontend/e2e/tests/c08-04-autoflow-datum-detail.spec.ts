import { expect, test } from '../support/cupola.fixture';
import { DomainObjectFixture } from '../support/fake-backend';

const AUTOFLOW = 'browse/mine/tables-lab/power-autoflow';

function autoflowObject(composition: string[]): DomainObjectFixture {
  return {
    identifier: { namespace: '', key: 'power-autoflow' },
    keyString: 'power-autoflow',
    name: 'Power autoflow',
    type: 'autoflow',
    location: 'tables-lab',
    composition,
    telemetry: null,
    created: '2026-07-02T14:51:08Z',
    modified: '2026-07-13T09:12:44Z',
    createdBy: 'j.reyes',
  };
}

async function columns(page: import('@playwright/test').Page): Promise<number> {
  const value = await page.getByTestId('autoflow-view').getAttribute('data-columns');
  return Number(value ?? 0);
}

test.describe('C08 L1-04 — Autoflow and datum detail', () => {
  test(
    'OMCT-C08-L2-04.01 — renders one row per child and reflows on resize',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-04.01' }] },
    async ({ shell, telemetryTable, page }) => {
      await page.setViewportSize({ width: 640, height: 800 });
      await shell.goto(AUTOFLOW);
      await expect(telemetryTable.autoflowRows).toHaveCount(2);
      const narrow = await columns(page);

      await page.setViewportSize({ width: 1600, height: 900 });
      await expect.poll(() => columns(page)).toBeGreaterThan(narrow);
    },
  );

  test(
    'OMCT-C08-L2-04.02 — applies limit styling to a row value',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-04.02' }] },
    async ({ shell, telemetryTable, realtime }) => {
      await shell.goto(AUTOFLOW);
      await expect(telemetryTable.autoflowRows).toHaveCount(2);

      // A value beyond the sine critical band styles the value cell critical.
      await realtime.pushTelemetry('pwr.bus_v', 0.95);
      await expect(telemetryTable.autoflowRow('pwr.bus_v')).toHaveClass(/is-limit-critical/);
    },
  );

  test(
    'OMCT-C08-L2-04.03 — adds and removes rows as composition changes',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-04.03' }] },
    async ({ shell, telemetryTable, realtime }) => {
      await shell.goto(AUTOFLOW);
      await expect(telemetryTable.autoflowRows).toHaveCount(2);

      await realtime.pushObjectUpdate(autoflowObject(['pwr.bus_v']));
      await expect(telemetryTable.autoflowRows).toHaveCount(1);

      await realtime.pushObjectUpdate(autoflowObject(['pwr.bus_v', 'pwr.array_out']));
      await expect(telemetryTable.autoflowRows).toHaveCount(2);
    },
  );

  test(
    'OMCT-C08-L2-04.04 — opens a datum detail overlay of the datum fields',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-04.04' }] },
    async ({ shell, telemetryTable, realtime }) => {
      await shell.goto(AUTOFLOW);
      await expect(telemetryTable.autoflowRows).toHaveCount(2);
      await realtime.pushTelemetry('pwr.bus_v', 28.4);

      await telemetryTable.autoflowRows.first().dblclick();
      await expect(telemetryTable.datumDetail).toBeVisible();
      // One row per metadata field (timestamp domain + value range).
      await expect(telemetryTable.datumRows).toHaveCount(2);
    },
  );
});
