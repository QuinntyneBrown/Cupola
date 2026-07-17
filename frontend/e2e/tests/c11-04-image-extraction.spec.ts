import { expect, test } from '../support/cupola.fixture';

const WINDOW = { start: 1783948800000, end: 1783949400000 };

test.describe('C11 L1-04 — Image extraction', () => {
  test(
    'OMCT-C11-L2-04.01 — the focused image opens in a new tab with opener isolation',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-04.01' }] },
    async ({ shell, imagery, realtime, context }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.focusedImage).toBeVisible();

      const popupPromise = context.waitForEvent('page');
      await imagery.control('open-new-tab').click();
      const popup = await popupPromise;
      await popup.waitForLoadState();

      expect(popup.url()).toContain('/imagery/frame-0.svg');
      expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    },
  );

  test(
    'OMCT-C11-L2-04.02 — the focused image saves through the browser download workflow',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-04.02' }] },
    async ({ shell, imagery, realtime, page }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.focusedImage).toBeVisible();

      const downloadPromise = page.waitForEvent('download');
      await imagery.control('save').click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/^Aft camera-.+Z\.svg$/);
    },
  );
});
