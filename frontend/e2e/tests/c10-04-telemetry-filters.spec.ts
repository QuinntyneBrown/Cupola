import { expect, test } from '../support/cupola.fixture';

const BUS_MONITOR = 'browse/mine/conditions-lab/bus-monitor';

test.describe('C10 L1-04 — Provider-side telemetry filters', () => {
  test(
    'OMCT-C10-L2-04.01 — filter controls render from telemetry metadata',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-04.01' }] },
    async ({ shell, inspector, conditionSet }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();

      await inspector.openTab('filters');

      await expect(conditionSet.filterRadios).toHaveCount(2); // single-selection enumeration
      await expect(conditionSet.filterCheckboxes).toHaveCount(2); // multi-selection enumeration
      await expect(conditionSet.filterTexts).toHaveCount(1); // free-text (no possible values)
    },
  );

  test(
    'OMCT-C10-L2-04.02 — a saved filter persists under the object scope',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-04.02' }] },
    async ({ shell, inspector, conditionSet, page }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();
      await inspector.openTab('filters');
      await expect(conditionSet.filterRadios).toHaveCount(2);

      const savePromise = page.waitForRequest(
        (request) => request.url().includes('/api/objects') && request.method() === 'POST',
      );
      await conditionSet.filterRadio('SAFE').check();
      const save = await savePromise;

      const body = JSON.stringify(save.postDataJSON());
      expect(body).toContain('byObject');
      expect(body).toContain('pwr.mode');
      expect(body).toContain('SAFE');
    },
  );

  test(
    'OMCT-C10-L2-04.03 — active filters propagate to telemetry requests',
    { annotation: [{ type: 'requirement', description: 'OMCT-C10-L2-04.03' }] },
    async ({ shell, inspector, conditionSet, page }) => {
      await shell.goto(BUS_MONITOR);
      await expect(conditionSet.view).toBeVisible();
      await inspector.openTab('filters');
      await expect(conditionSet.filterRadios).toHaveCount(2);

      const requestPromise = page.waitForRequest(
        (request) =>
          request.url().includes('/api/telemetry/pwr.mode') &&
          new URL(request.url()).searchParams.has('filters'),
      );
      await conditionSet.filterRadio('SAFE').check();
      const request = await requestPromise;

      const filters = JSON.parse(new URL(request.url()).searchParams.get('filters') ?? '[]');
      expect(filters).toContainEqual({ key: 'mode', comparator: 'equals', values: ['SAFE'] });
    },
  );
});
