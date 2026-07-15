import { expect, test } from '../support/cupola.fixture';

test.describe('C16 L1-06 — License and version disclosure', () => {
  test(
    'OMCT-C16-L2-06.01 — the about dialog shows version, build date, revision, and branch',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-06.01' }] },
    async ({ shell, aboutDialog, page }) => {
      await shell.goto('browse/mine');
      await page.getByTestId('app-logo').click();

      await expect(aboutDialog.dialog).toBeVisible();
      await expect(aboutDialog.version).toHaveText('0.1.0');
      await expect(aboutDialog.revision).toHaveText('a3f9c21');
      await expect(aboutDialog.dialog).toContainText('2026-07-13');
      await expect(aboutDialog.dialog).toContainText('main');
    },
  );

  test(
    'OMCT-C16-L2-06.02 — the about dialog discloses the MIT license and links to third-party licenses',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-06.02' }] },
    async ({ shell, aboutDialog, page }) => {
      await shell.goto('browse/mine');
      await page.getByTestId('app-logo').click();

      await expect(page.getByTestId('about-license-text')).toContainText('MIT License');
      await expect(aboutDialog.license).toBeVisible();
      await expect(aboutDialog.license).toHaveAttribute('href', '/licenses');
    },
  );

  test(
    'OMCT-C16-L2-06.03 — the /licenses route renders a full-screen overlay of third-party licenses',
    { annotation: [{ type: 'requirement', description: 'OMCT-C16-L2-06.03' }] },
    async ({ shell, licenses }) => {
      await shell.goto('licenses');

      await expect(licenses.overlay).toBeVisible();
      await expect(licenses.projectText).toContainText('MIT License');
      await expect(licenses.thirdParty).toContainText('@angular/core');
      expect(await licenses.entries.count()).toBeGreaterThan(0);
    },
  );
});
