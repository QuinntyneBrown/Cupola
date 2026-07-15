import { expect, test } from '../../../support/cupola.fixture';

/**
 * Contract performance specification (OMCT-C16-L2-05.02). Runs against the dev
 * server where performance timing marks are available and asserts a shell paint
 * budget. Notebook and imagery contract performance specs are deferred to the
 * C13 and C11 waves.
 */
test.describe('C16 L1-05 — Contract performance', () => {
  test(
    'OMCT-C16-L2-05.02 — first contentful paint is within the contract budget',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-05.02' }] },
    async ({ shell, page }) => {
      await shell.goto('browse/mine');
      await expect(shell.appBar).toBeVisible();

      const fcp = await page.evaluate(() => {
        const entry = performance.getEntriesByName('first-contentful-paint')[0];
        return entry ? entry.startTime : null;
      });

      expect(fcp).not.toBeNull();
      expect(fcp as number).toBeLessThan(8_000);
    },
  );
});
