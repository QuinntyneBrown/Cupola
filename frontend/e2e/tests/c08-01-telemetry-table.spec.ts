import { readFileSync } from 'node:fs';

import { expect, test } from '../support/cupola.fixture';

const TABLE = 'browse/mine/tables-lab/bus-v-table';

test.describe('C08 L1-01 — Telemetry table', () => {
  test(
    'OMCT-C08-L2-01.01 — renders one row per datum and one column per metadata value',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.01' }] },
    async ({ shell, telemetryTable }) => {
      await shell.goto(TABLE);
      await expect(telemetryTable.view).toBeVisible();
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);
      // Two composed members contribute a Name column plus the shared metadata columns.
      await expect(telemetryTable.sortHeader('name')).toBeVisible();
      await expect(telemetryTable.sortHeader('timestamp')).toBeVisible();
      await expect(telemetryTable.sortHeader('value')).toBeVisible();
    },
  );

  test(
    'OMCT-C08-L2-01.02 — shows the progress indicator only while the request is active',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.02' }] },
    async ({ shell, telemetryTable, page }) => {
      await page.route('**/api/telemetry/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        await route.fallback();
      });
      await shell.goto(TABLE);
      // The indeterminate progress bar shows while the historical request is in flight.
      await expect(telemetryTable.progress).toBeVisible();
      // Once data resolves, the progress bar is gone and rows are rendered.
      await expect(telemetryTable.progress).toBeHidden();
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);
    },
  );

  test(
    'OMCT-C08-L2-01.03 — replaces a row in place when a datum shares its update key',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.03' }] },
    async ({ shell, telemetryTable, realtime, page }) => {
      await shell.goto(TABLE);
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);

      const timestamp = new Date(Date.now() - 60_000).toISOString();
      await realtime.pushTelemetry('pwr.bus_v', 12.3, timestamp);
      const cell = page.locator(
        `[data-testid="table-row"][data-key="pwr.bus_v::${timestamp}"] [data-testid="table-cell"][data-col="value"]`,
      );
      await expect(cell).toHaveText('12.3');
      const afterFirst = await telemetryTable.rowCount();

      // A second datum with the same timestamp updates the existing row, not a new one.
      await realtime.pushTelemetry('pwr.bus_v', 45.6, timestamp);
      await expect(cell).toHaveText('45.6');
      expect(await telemetryTable.rowCount()).toBe(afterFirst);
    },
  );

  test(
    'OMCT-C08-L2-01.04 — persists column configuration and reloads it',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.04' }] },
    async ({ shell, telemetryTable, page }) => {
      await shell.goto(TABLE);
      await expect(telemetryTable.sortHeader('timestamp')).toBeVisible();
      await telemetryTable.columnsButton.click();
      await expect(telemetryTable.columnMenu).toBeVisible();

      const save = page.waitForRequest(
        (request) =>
          request.method() === 'POST' &&
          (request.postData() ?? '').includes('"table"') &&
          (request.postData() ?? '').includes('timestamp'),
      );
      await telemetryTable.columnToggle('timestamp').click();
      const body = (await save).postData() ?? '';
      expect(body).toContain('"visible":false');

      // The column disappears from the open table and stays hidden after reload.
      await expect(telemetryTable.sortHeader('timestamp')).toHaveCount(0);
      await shell.goto(TABLE);
      await expect(telemetryTable.view).toBeVisible();
      await expect(telemetryTable.sortHeader('timestamp')).toHaveCount(0);
    },
  );

  test(
    'OMCT-C08-L2-01.05 — filters and sorts by column value',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.05' }] },
    async ({ shell, telemetryTable }) => {
      await shell.goto(TABLE);
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);

      // Filter the Name column to a single member — only its rows remain.
      await telemetryTable.filterInput('name').fill('Bus');
      await expect
        .poll(async () => {
          const members = await telemetryTable.rows.evaluateAll((rows) =>
            rows.map((row) => row.getAttribute('data-member')),
          );
          return members.every((member) => member === 'pwr.bus_v');
        })
        .toBe(true);

      // Sorting toggles the active column direction.
      await telemetryTable.sortHeader('timestamp').click();
      await expect(telemetryTable.sortHeader('timestamp')).toHaveAttribute(
        'aria-sort',
        'ascending',
      );
      await telemetryTable.sortHeader('timestamp').click();
      await expect(telemetryTable.sortHeader('timestamp')).toHaveAttribute(
        'aria-sort',
        'descending',
      );
    },
  );

  test(
    'OMCT-C08-L2-01.06 — marking a row pauses visible realtime updates',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.06' }] },
    async ({ shell, telemetryTable, realtime }) => {
      await shell.goto(TABLE);
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);
      const before = await telemetryTable.rowCount();

      await telemetryTable.rows.first().click();
      await expect(telemetryTable.paused).toBeVisible();

      // A fresh datum does not grow the frozen row set.
      await realtime.pushTelemetry('pwr.bus_v', 7.7, new Date(Date.now() - 30_000).toISOString());
      await expect(telemetryTable.paused).toBeVisible();
      expect(await telemetryTable.rowCount()).toBe(before);
    },
  );

  test(
    'OMCT-C08-L2-01.07 — a user bounds change clears the pause and refreshes',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.07' }] },
    async ({ shell, telemetryTable, realtime }) => {
      await shell.goto(TABLE);
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);

      await telemetryTable.rows.first().click();
      await expect(telemetryTable.paused).toBeVisible();

      const now = Date.now();
      await realtime.setBounds({ start: now - 10 * 60_000, end: now });
      await expect(telemetryTable.paused).toBeHidden();
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);
    },
  );

  test(
    'OMCT-C08-L2-01.08 — exports rows as CSV with neutralized cells',
    { annotation: [{ type: 'requirement', description: 'OMCT-C08-L2-01.08' }] },
    async ({ shell, telemetryTable, realtime, page }) => {
      await shell.goto(TABLE);
      await expect.poll(() => telemetryTable.rowCount()).toBeGreaterThan(0);

      // A negative value serializes to a formula-leading cell that must be neutralized.
      await realtime.pushTelemetry('pwr.bus_v', -5, new Date(Date.now() - 45_000).toISOString());

      await telemetryTable.exportButton.click();
      await expect(telemetryTable.exportMenu).toBeVisible();
      const downloadPromise = page.waitForEvent('download');
      await telemetryTable.exportAll.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('Bus voltage table.csv');

      const path = await download.path();
      const content = readFileSync(path, 'utf8');
      expect(content.split('\r\n')[0]).toContain('Value');
      // The -5 cell is prefixed with a single quote (B17 formula neutralization).
      expect(content).toContain("'-5");
    },
  );
});
