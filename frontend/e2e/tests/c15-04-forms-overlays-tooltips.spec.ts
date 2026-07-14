import { expect, test } from '../support/cupola.fixture';

test.describe('C15 L1-04 — Forms, overlays, and tooltips', () => {
  test(
    'OMCT-C15-L2-04.03 — an edit form saves changed values and cancel discards them',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-04.03' }] },
    async ({ shell, objectView, tree, formDialog, page }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');

      // Save path: the new title propagates to the toolbar and the tree.
      await page.getByTestId('edit-properties').click();
      await expect(formDialog.form).toBeVisible();
      await formDialog.fill('name', 'Renamed plot');
      await formDialog.save();

      await expect(formDialog.form).toHaveCount(0);
      await expect(objectView.title).toHaveText('Renamed plot');
      await expect(tree.label('solar-array-output')).toHaveText('Renamed plot');

      // Cancel path: a discarded edit leaves the title unchanged.
      await page.getByTestId('edit-properties').click();
      await formDialog.fill('name', 'Discarded');
      await formDialog.cancel();

      await expect(formDialog.form).toHaveCount(0);
      await expect(objectView.title).toHaveText('Renamed plot');
    },
  );

  test(
    'OMCT-C15-L2-04.04 — Escape dismisses the top overlay',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-04.04' }] },
    async ({ shell, objectView, overlay, formDialog, page }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');

      await page.getByTestId('edit-properties').click();
      await expect(formDialog.form).toBeVisible();
      await expect(overlay.scrims).toHaveCount(1);

      await page.keyboard.press('Escape');

      await expect(overlay.scrims).toHaveCount(0);
      await expect(objectView.title).toHaveText('Solar array output');
    },
  );

  test(
    'OMCT-C15-L2-04.05 — only one tooltip is shown at a time',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-04.05' }] },
    async ({ shell, tree, page }) => {
      await shell.goto('browse/mine');

      await tree.row('station').hover();
      const tooltip = page.getByTestId('tooltip');
      await expect(tooltip).toHaveCount(1);
      await expect(tooltip).toContainText('Station');

      await tree.row('mine').hover();
      await expect(tooltip).toHaveCount(1);
      await expect(tooltip).toContainText('My Items');
    },
  );
});
