import { readFileSync } from 'node:fs';

import { expect, test } from '../support/cupola.fixture';

const OPS_NOTEBOOK = 'browse/mine/ops-notebook';

test.describe('C13 L1-02 — Notebook capture, search, and export', () => {
  test(
    'OMCT-C13-L2-02.01 — copy to notebook creates an entry in the default destination',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-02.01' }] },
    async ({ shell, notebook, tree, contextMenu, page }) => {
      // Pin the EVA 71 page as the default copy destination.
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.view).toBeVisible();
      await notebook.pageItem('EVA 71').getByTestId('notebook-set-default').click();
      await expect(notebook.defaultPin).toBeVisible();

      await shell.goto('browse/station/power/pwr.bus_v');
      await tree.row('pwr.bus_v').click({ button: 'right' });
      const saved = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          /\/api\/objects(\/batch)?$/.test(new URL(response.url()).pathname),
      );
      await contextMenu.item('Copy to notebook').click();
      await saved;

      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.entries).toHaveCount(3);
      await expect(notebook.entryBodies.filter({ hasText: 'Bus voltage' })).toHaveCount(1);
    },
  );

  test(
    'OMCT-C13-L2-02.02 — an entry displays its captured snapshot embed',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-02.02' }] },
    async ({ shell, notebook }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.view).toBeVisible();
      await expect(notebook.embeds.first()).toBeVisible();
      await expect(notebook.embeds.first().getByTestId('notebook-embed-name')).toHaveText(
        'Bus voltage',
      );
    },
  );

  test(
    'OMCT-C13-L2-02.03 — expanding a snapshot opens the referenced object in an overlay',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-02.03' }] },
    async ({ shell, notebook, overlay }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.embeds.first()).toBeVisible();

      await notebook.embeds.first().click();
      await expect(overlay.top()).toBeVisible();
      await expect(overlay.preview()).toBeVisible();
    },
  );

  test(
    'OMCT-C13-L2-02.04 — in-notebook search filters the entries to matches',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-02.04' }] },
    async ({ shell, notebook }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.entries).toHaveCount(2);

      await notebook.searchInput.fill('battery');
      await expect(notebook.entries).toHaveCount(1);
      await expect(notebook.entries.first().getByTestId('notebook-entry-body')).toContainText(
        'battery',
      );

      await notebook.searchInput.fill('');
      await expect(notebook.entries).toHaveCount(2);
    },
  );

  test(
    'OMCT-C13-L2-02.05 — export downloads the notebook as text',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-02.05' }] },
    async ({ shell, tree, contextMenu, page }) => {
      await shell.goto(OPS_NOTEBOOK);
      await tree.row('ops-notebook').click({ button: 'right' });

      const downloadPromise = page.waitForEvent('download');
      await contextMenu.item('Export as text').click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toBe('Ops notebook.txt');
      const content = readFileSync(await download.path(), 'utf8');
      expect(content).toContain('EVA operations');
      expect(content).toContain('battery');
    },
  );

  test(
    'OMCT-C13-L2-02.06 — a restricted notebook links whitelisted URLs and blocks the rest',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-02.06' }] },
    async ({ shell, notebook, page }) => {
      await shell.goto('browse/mine/notebook-lab/shift-log');
      await expect(notebook.view).toBeVisible();
      await expect(notebook.entries).toHaveCount(2);

      // The example.com reference renders as a link; the example.org one is inert.
      await expect(page.locator('[data-testid="notebook-entry-body"] a.cp-link')).toHaveCount(1);
      await expect(page.locator('[data-testid="notebook-entry-body"] a.cp-link')).toHaveAttribute(
        'href',
        'https://ops.example.com/procedure',
      );
      await expect(notebook.blockedUrls).toHaveCount(1);
      await expect(notebook.blockedUrls).toContainText('Blocked URL');
    },
  );
});
