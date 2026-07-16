import { expect, test } from '../support/cupola.fixture';

const BUS_MONITOR = 'browse/mine/conditions-lab/bus-monitor';

test.describe('C10 L1-01 — Condition evaluation', () => {
  test(
    'OMCT-C10-L2-01.01 — a condition set composes telemetry-producing children',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-01.01' }] },
    async ({ shell, conditionSet, page }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();

      // The criteria reference the composed telemetry sources, which the
      // composition policy admits (non-telemetry children are rejected — covered
      // by the composition-policy unit spec).
      const sourceOptions = page
        .locator('[data-testid="criterion-source"]')
        .first()
        .locator('option');
      await expect(sourceOptions.filter({ hasText: 'pwr.bus_v' })).toHaveCount(1);
    },
  );

  test(
    'OMCT-C10-L2-01.02 — configured comparison operations drive the Boolean result',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-01.02' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.bus_v', 20);
      await expect(conditionSet.activeOutput).toHaveText('UNDERVOLTAGE');
    },
  );

  test(
    'OMCT-C10-L2-01.03 — a triggered condition evaluates its criteria',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-01.03' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();
      await conditionSet.settle();

      await realtime.pushTelemetry('pwr.bus_v', 30);
      await expect(conditionSet.activeOutput).toHaveText('NOMINAL');
      await expect(conditionSet.activeBadge('nominal')).toBeVisible();
    },
  );

  test(
    'OMCT-C10-L2-01.04 — evaluation publishes the first matching condition in order',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-01.04' }] },
    async ({ shell, conditionSet, realtime }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();
      await conditionSet.settle();

      // 20 V: the stale condition (ordered first) is false, so the first true
      // condition — undervoltage — is published, not nominal.
      await realtime.pushTelemetry('pwr.bus_v', 20);
      await expect(conditionSet.activeBadge('undervolt')).toBeVisible();
      await expect(conditionSet.activeBadge('nominal')).toHaveCount(0);
    },
  );

  test(
    'OMCT-C10-L2-01.05 — the old-data criterion activates after the no-data interval',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-01.05' }] },
    async ({ shell, conditionSet }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();

      // No realtime telemetry arrives; once the 1s interval elapses the
      // ordered-first "No data" condition becomes active.
      await expect(conditionSet.activeOutput).toHaveText('NO DATA', { timeout: 8000 });
      await expect(conditionSet.activeBadge('stale')).toBeVisible();
    },
  );

  test(
    'OMCT-C10-L2-01.06 — editing a condition set persists and survives reload',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-01.06' }] },
    async ({ shell, conditionSet, page }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();
      const rows = page.getByTestId('condition-row');
      await expect(rows).toHaveCount(4);

      const savePromise = page.waitForRequest(
        (request) => request.url().includes('/api/objects') && request.method() === 'POST',
      );
      await conditionSet.addCondition.click();
      const save = await savePromise;
      expect(JSON.stringify(save.postDataJSON())).toContain('conditions');
      await expect(rows).toHaveCount(5);

      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();
      await expect(page.getByTestId('condition-row')).toHaveCount(5);
    },
  );
});
