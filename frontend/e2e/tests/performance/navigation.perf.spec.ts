import { expect, test } from '../../support/cupola.fixture';

/**
 * Non-contract performance scenarios (OMCT-C16-L2-05.01). Scoped to the shell
 * navigation and search flows that exist today; plot-tagging (05.05) and
 * tab-rendering (05.04) performance are deferred to the C07 and C09 waves.
 */
test.describe('C16 L1-05 — Performance', () => {
  test(
    'OMCT-C16-L2-05.01 — the browse shell becomes interactive within budget',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-05.01' }] },
    async ({ shell, page }) => {
      const start = await page.evaluate(() => performance.now());
      await shell.goto('browse/mine');
      await expect(shell.appBar).toBeVisible();
      const elapsed = (await page.evaluate(() => performance.now())) - start;
      expect(elapsed).toBeLessThan(10_000);
    },
  );

  test(
    'OMCT-C16-L2-05.01 — search returns results within budget',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-05.01' }] },
    async ({ shell, grandSearch, page }) => {
      await shell.goto('browse/mine');
      await expect(shell.appBar).toBeVisible();

      const start = await page.evaluate(() => performance.now());
      await grandSearch.search('solar');
      await expect(grandSearch.objectResults.first()).toBeVisible();
      const elapsed = (await page.evaluate(() => performance.now())) - start;
      expect(elapsed).toBeLessThan(5_000);
    },
  );
});
