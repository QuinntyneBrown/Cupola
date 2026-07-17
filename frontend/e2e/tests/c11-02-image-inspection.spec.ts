import { Request } from '@playwright/test';

import { expect, test } from '../support/cupola.fixture';

const WINDOW = { start: 1783948800000, end: 1783949400000 };

const savesCamAft = (request: Request): boolean =>
  request.method() === 'POST' &&
  request.url().includes('/api/objects') &&
  (request.postData() ?? '').includes('layerVisibility');

test.describe('C11 L1-02 — Image inspection controls', () => {
  test(
    'OMCT-C11-L2-02.01 — zoom scales around the interaction point and pan translates while zoomed',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-02.01' }] },
    async ({ shell, imagery, realtime, page }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.focusedImage).toBeVisible();

      await imagery.control('zoom-in').click();
      await imagery.control('zoom-in').click();
      await expect(imagery.stage).toHaveClass(/im-stage--zoom/);
      const before = await imagery.viewableAreaRegion.boundingBox();

      // Pan while zoomed: drag the stage; the viewable region moves.
      const stage = (await imagery.stage.boundingBox())!;
      await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
      await page.mouse.down();
      await page.mouse.move(stage.x + stage.width / 2 + 80, stage.y + stage.height / 2 + 40, {
        steps: 4,
      });
      await page.mouse.up();

      const after = await imagery.viewableAreaRegion.boundingBox();
      expect(after!.x).not.toBeCloseTo(before!.x, 1);
    },
  );

  test(
    'OMCT-C11-L2-02.02 — the viewable-area indicator appears only while zoom exceeds one',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-02.02' }] },
    async ({ shell, imagery, realtime }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.focusedImage).toBeVisible();
      await expect(imagery.viewableArea).toHaveCount(0);

      await imagery.control('zoom-in').click();
      await expect(imagery.viewableArea).toBeVisible();

      await imagery.control('zoom-reset').click();
      await expect(imagery.viewableArea).toHaveCount(0);
    },
  );

  test(
    'OMCT-C11-L2-02.03 — brightness and contrast filter the image and reset to 100 percent',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-02.03' }] },
    async ({ shell, imagery, realtime }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.focusedImage).toBeVisible();

      await imagery.control('filters-toggle').click();
      await imagery.brightness.fill('160');
      await imagery.contrast.fill('80');
      await expect(imagery.focusedImage).toHaveCSS('filter', 'brightness(1.6) contrast(0.8)');

      await imagery.filtersReset.click();
      await expect(imagery.focusedImage).toHaveCSS('filter', 'brightness(1) contrast(1)');
    },
  );

  test(
    'OMCT-C11-L2-02.04 — layer toggles update overlays and persist visibility for mutable objects',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-02.04' }] },
    async ({ shell, imagery, realtime, page }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.layerOverlay('reticle')).toBeVisible();
      await expect(imagery.layerOverlay('horizon')).toHaveCount(0);

      await imagery.control('layers-toggle').click();
      const saved = page.waitForRequest(savesCamAft);
      await imagery.layerToggle('horizon').click();
      await expect(imagery.layerOverlay('horizon')).toBeVisible();
      await saved;
    },
  );

  test(
    'OMCT-C11-L2-02.05 — the compass rose and heads-up display render the calculated orientation',
    { annotation: [{ type: 'requirement', description: 'OMCT-C11-L2-02.05' }] },
    async ({ shell, imagery, realtime, page }) => {
      await shell.goto('browse/mine/imagery-lab/cam.aft');
      await realtime.setBounds(WINDOW);
      await expect(imagery.compass).toBeVisible();

      // The deterministic generator yields heading = (t/1000 * 0.75) % 360 = 90
      // at the focused (latest) grid instant of the pinned window.
      await expect(imagery.compassHud).toHaveText('HDG 90.0°');
      const transform = await page.getByTestId('compass-rose').getAttribute('transform');
      expect(transform).toMatch(/^rotate\(/);
    },
  );
});
