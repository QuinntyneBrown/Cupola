import { expect, test } from '../support/cupola.fixture';

test.describe('C15 L1-05 — Adaptive shell, theme, and branding', () => {
  test(
    'OMCT-C15-L2-05.01 — desktop viewports get desktop and landscape body classes',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-05.01' }] },
    async ({ shell }) => {
      await shell.goto('browse/mine');

      const classes = await shell.bodyClasses();
      expect(classes).toContain('desktop');
      expect(classes).toContain('landscape');
      expect(classes).not.toContain('phone');
      expect(classes).not.toContain('touch');
    },
  );

  test.describe('phone viewport', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test(
      'OMCT-C15-L2-05.01 — phone viewports get mobile, phone, portrait, and touch body classes',
      { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-05.01' }] },
      async ({ shell }) => {
        await shell.goto('browse/mine');

        const classes = await shell.bodyClasses();
        expect(classes).toContain('mobile');
        expect(classes).toContain('phone');
        expect(classes).toContain('portrait');
        expect(classes).toContain('touch');
        expect(classes).not.toContain('desktop');
      },
    );
  });

  test(
    'OMCT-C15-L2-05.02 — exactly one darkmatter theme stylesheet is installed',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-05.02' }] },
    async ({ shell }) => {
      await shell.goto('browse/mine');

      await expect(shell.themeLink).toHaveCount(1);
      await expect(shell.themeLink).toHaveAttribute('href', /theme-darkmatter\.css$/);
    },
  );

  test(
    'OMCT-C15-L2-05.03 — configured branding renders in the shell',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-05.03' }] },
    async ({ shell, aboutDialog, page }) => {
      await shell.goto('browse/mine');

      await page.getByTestId('app-logo').click();
      await expect(aboutDialog.title).toContainText('Cupola');
      await expect(aboutDialog.dialog).toContainText('Mission operations frontend');
    },
  );

  test(
    'OMCT-C15-L2-05.04 — the logo opens an about dialog with build and license information',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-05.04' }] },
    async ({ shell, aboutDialog, overlay, page }) => {
      await shell.goto('browse/mine');

      await page.getByTestId('app-logo').click();
      await expect(aboutDialog.dialog).toBeVisible();
      await expect(aboutDialog.version).toHaveText('0.1.0');
      await expect(aboutDialog.revision).toHaveText('a3f9c21');
      await expect(aboutDialog.license).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(overlay.scrims).toHaveCount(0);
    },
  );

  test(
    'OMCT-C15-L2-05.05 — search shows object and annotation results and navigates on selection',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-05.05' }] },
    async ({ shell, grandSearch, objectView, page }) => {
      await shell.goto('browse/mine');

      await grandSearch.search('solar');
      await expect(grandSearch.objectResults).toHaveCount(2);
      await expect(grandSearch.annotationResults).toHaveCount(1);
      await expect(grandSearch.marks.first()).toHaveText('Solar');

      // Enter activates the first result (an object).
      await grandSearch.input.press('Enter');
      await expect(page).toHaveURL(/#\/browse\/solar-array-output$/);
      await expect(objectView.title).toHaveText('Solar array output');

      // An annotation result navigates to its target object with the annotation param.
      await grandSearch.search('eclipse');
      await expect(grandSearch.annotationResults).toHaveCount(1);
      await grandSearch.annotationResults.first().click();
      await expect(page).toHaveURL(/#\/browse\/ops-notebook\?annotation=ann-1$/);
    },
  );
});
