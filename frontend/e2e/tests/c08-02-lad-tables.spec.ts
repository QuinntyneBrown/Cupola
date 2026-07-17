import { expect, test } from '../support/cupola.fixture';

const LAD = 'browse/mine/tables-lab/power-lad';
const LAD_SET = 'browse/mine/tables-lab/station-lad-set';

test.describe('C08 L1-02 — Latest-available-data tables', () => {
  test(
    'OMCT-C08-L2-02.01 — a LAD table renders a row for each telemetry-producing child',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-02.01' }] },
    async ({ shell, telemetryTable }) => {
      await shell.goto(LAD);
      await expect(telemetryTable.ladTable).toBeVisible();
      // Both composed telemetry points are accepted and rendered, one row each.
      await expect(telemetryTable.ladRows).toHaveCount(2);
    },
  );

  test(
    'OMCT-C08-L2-02.02 — each row shows the latest value and updates in place',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-02.02' }] },
    async ({ shell, telemetryTable, realtime }) => {
      await shell.goto(LAD);
      await expect(telemetryTable.ladRows).toHaveCount(2);

      await realtime.pushTelemetry('pwr.bus_v', 33.3);
      await expect(telemetryTable.ladRow('pwr.bus_v')).toContainText('33.3');
      await expect(telemetryTable.ladRows).toHaveCount(2);
    },
  );

  test(
    'OMCT-C08-L2-02.03 — a LAD table set renders one section per composed table',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-02.03' }] },
    async ({ shell, telemetryTable }) => {
      await shell.goto(LAD_SET);
      await expect(telemetryTable.ladGroups).toHaveCount(1);
      // The embedded table renders its own rows within the section.
      await expect(telemetryTable.ladRows).toHaveCount(2);
    },
  );
});
