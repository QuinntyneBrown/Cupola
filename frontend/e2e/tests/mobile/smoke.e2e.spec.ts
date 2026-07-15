import { expect, test } from '../../support/cupola.fixture';

/**
 * Mobile viewport smoke scenarios (OMCT-C16-L2-03.04), run under the iPad
 * landscape and iPhone 14 Pro projects. Removal confirmation is deferred to the
 * C03 authoring wave; no destructive-action UI exists yet.
 */
test.describe('C16 L1-03 — Mobile shell smoke', () => {
  test(
    'OMCT-C16-L2-03.04 — the browse tree is visible on mobile',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-03.04' }] },
    async ({ shell, tree }) => {
      await shell.goto('browse/mine');
      await expect(shell.appBar).toBeVisible();
      await expect(shell.treePane).toBeVisible();
      await expect(tree.rows.first()).toBeVisible();
    },
  );

  test(
    'OMCT-C16-L2-03.04 — search navigates to a result on mobile',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-03.04' }] },
    async ({ shell, grandSearch, objectView }) => {
      await shell.goto('browse/mine');
      await grandSearch.search('solar');
      await expect(grandSearch.objectResults.first()).toBeVisible();

      await grandSearch.input.press('Enter');
      await expect(objectView.title).toBeVisible();
    },
  );

  test(
    'OMCT-C16-L2-03.04 — the time conductor is available on mobile',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-03.04' }] },
    async ({ shell, page }) => {
      await shell.goto('browse/mine');
      await expect(page.getByTestId('conductor')).toBeVisible();
      await expect(page.getByTestId('conductor-mode').first()).toBeVisible();
    },
  );
});
