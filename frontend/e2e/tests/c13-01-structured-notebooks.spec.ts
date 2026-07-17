import { expect, test } from '../support/cupola.fixture';

const OPS_NOTEBOOK = 'browse/mine/ops-notebook';

test.describe('C13 L1-01 — Structured operational notebooks', () => {
  test(
    'OMCT-C13-L2-01.01 — the create menu offers notebook types that initialize a section and page',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-01.01' }] },
    async ({ shell, tree, contextMenu, notebook, page }) => {
      // The create menu offers the installed standard and restricted notebook
      // types. (initialize() itself — the single seeded section and page — is
      // asserted in register-notebook.spec.ts.)
      await shell.goto('browse/mine/notebook-lab');
      await tree.row('notebook-lab').click({ button: 'right' });
      await expect(contextMenu.menu).toBeVisible();
      await expect(contextMenu.item('Notebook')).toBeVisible();
      await expect(contextMenu.item('Restricted Notebook')).toBeVisible();
      await page.keyboard.press('Escape');

      // A notebook presents the single section and page that initialization creates.
      await shell.goto('browse/mine/ops-notebook');
      await expect(notebook.view).toBeVisible();
      await expect(notebook.sections).toHaveCount(1);
      await expect(notebook.pages).toHaveCount(1);
    },
  );

  test(
    'OMCT-C13-L2-01.02 — sections and pages can be added, renamed, and deleted',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-01.02' }] },
    async ({ shell, notebook, page }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.view).toBeVisible();
      await expect(notebook.sections).toHaveCount(1);

      await notebook.addSection.click();
      await expect(notebook.sections).toHaveCount(2);

      await notebook.section('New section').getByTestId('notebook-rename-section').click();
      const rename = page.getByTestId('notebook-rename-input');
      await rename.fill('Anomalies');
      await rename.press('Enter');
      await expect(notebook.section('Anomalies')).toBeVisible();

      await notebook.section('Anomalies').getByTestId('notebook-delete-section').click();
      await expect(notebook.sections).toHaveCount(1);

      await notebook.addPage.click();
      await expect(notebook.pages).toHaveCount(2);
      await notebook.pageItem('New page').getByTestId('notebook-delete-page').click();
      await expect(notebook.pages).toHaveCount(1);
    },
  );

  test(
    'OMCT-C13-L2-01.03 — a new entry records its timestamp and the active user',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-01.03' }] },
    async ({ shell, notebook }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.entries).toHaveCount(2);

      await notebook.writeEntry('Checked drive torque values before egress');
      await expect(notebook.entries).toHaveCount(3);

      const created = notebook.entries.last();
      await expect(created.getByTestId('notebook-entry-timestamp')).toBeVisible();
      await expect(notebook.entryAuthor(created)).toContainText('Operator');
      await expect(created.getByTestId('notebook-entry-body')).toContainText('drive torque');
    },
  );

  test(
    'OMCT-C13-L2-01.04 — an entry can be edited and deleted',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-01.04' }] },
    async ({ shell, notebook }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.entries).toHaveCount(2);

      const first = notebook.entries.first();
      await notebook.editEntry(first).click();
      await notebook.editor.fill('Torqued battery 2B bolts — re-verified nominal');
      await notebook.saveEntry.click();
      await expect(notebook.entries.first().getByTestId('notebook-entry-body')).toContainText(
        're-verified',
      );

      await notebook.deleteEntry(notebook.entries.first()).click();
      await expect(notebook.entries).toHaveCount(1);
    },
  );

  test(
    'OMCT-C13-L2-01.05 — the default destination persists across a reload',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-01.05' }] },
    async ({ shell, notebook, page }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.view).toBeVisible();

      await notebook.pageItem('EVA 71').getByTestId('notebook-set-default').click();
      await expect(notebook.defaultPin).toBeVisible();

      await page.reload();
      await expect(notebook.view).toBeVisible();
      await expect(notebook.defaultPin).toBeVisible();
    },
  );
});
