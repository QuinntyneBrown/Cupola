import { expect, test } from '../support/cupola.fixture';

// The annotation-authoring inspector surfaces OMCT-C13-L2-04.01 (creation) and
// 04.04 (tag add/remove). The remaining L1-04 requirements have no UI surface —
// their actor is "an extension" — and are covered by Jest: 04.02 (immutable
// target) and 04.03 (validation) in annotation.service.spec.ts, 04.05 (tag
// search) in tag-registry.spec.ts, and 04.06 (target comparison) in
// target-comparators.spec.ts.

const BUS_VOLTAGE = 'browse/station/power/pwr.bus_v';

test.describe('C13 L1-04 — General annotations and tags', () => {
  test(
    'OMCT-C13-L2-04.01 — creating an annotation persists it and shows it in the list',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-04.01' }] },
    async ({ shell, inspector, page }) => {
      await shell.goto(BUS_VOLTAGE);
      await inspector.openTab('annotations');
      await expect(page.getByTestId('annotation-authoring')).toBeVisible();

      await page.getByTestId('annotation-text').fill('Torque check reference point');
      await page.getByTestId('annotation-tag-input').fill('inspection');
      await page.getByTestId('annotation-tag-input').press('Enter');
      await expect(page.getByTestId('annotation-draft-tag')).toHaveText(/inspection/);

      const saved = page.waitForRequest(
        (request) =>
          request.method() === 'POST' &&
          /\/api\/objects(\/batch)?$/.test(new URL(request.url()).pathname),
      );
      await page.getByTestId('annotation-create').click();
      const request = await saved;

      // The persisted object is an annotation-typed domain object (OMCT-C13-L2-04.01).
      const payload = request.postDataJSON() as unknown;
      const objects = Array.isArray(payload) ? payload : [payload];
      const annotation = objects.find(
        (object) => (object as { type?: string }).type === 'annotation',
      ) as { configuration?: { annotation?: { text?: string; targets?: string[] } } } | undefined;
      expect(annotation).toBeTruthy();
      expect(annotation!.configuration?.annotation?.text).toBe('Torque check reference point');
      expect(annotation!.configuration?.annotation?.targets).toContain('pwr.bus_v');

      await expect(page.getByTestId('annotation-row')).toHaveCount(1);
      await expect(page.getByTestId('annotation-row').first()).toContainText('Torque check');
    },
  );

  test(
    'OMCT-C13-L2-04.04 — tags can be added to and removed from an annotation draft',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-04.04' }] },
    async ({ shell, inspector, page }) => {
      await shell.goto(BUS_VOLTAGE);
      await inspector.openTab('annotations');

      await page.getByTestId('annotation-tag-input').fill('eva');
      await page.getByTestId('annotation-tag-input').press('Enter');
      await expect(page.getByTestId('annotation-draft-tag')).toHaveCount(1);

      await page.getByTestId('annotation-remove-tag').click();
      await expect(page.getByTestId('annotation-draft-tag')).toHaveCount(0);
    },
  );
});
