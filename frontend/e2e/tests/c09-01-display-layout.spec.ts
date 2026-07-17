import { Request } from '@playwright/test';

import { expect, test } from '../support/cupola.fixture';

const savesDlStation = (request: Request): boolean =>
  request.method() === 'POST' &&
  request.url().includes('/api/objects') &&
  (request.postData() ?? '').includes('dl.station');

test.describe('C09 L1-01 — Display-layout canvas', () => {
  test(
    'OMCT-C09-L2-01.01 — a display layout renders its configured canvas and contained view items',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-01.01' }] },
    async ({ shell, layout }) => {
      await shell.goto('browse/mine/layouts-lab/dl.station');

      await expect(layout.canvas).toBeVisible();
      await expect(layout.frames).toHaveCount(4);
      await expect(layout.framesOfKind('text')).toContainText('Station overview');
      await expect(layout.framesOfKind('subobject')).toHaveCount(2);
    },
  );

  test(
    'OMCT-C09-L2-01.02 — composition changes add or remove the corresponding layout items',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-01.02' }] },
    async ({ shell, layout, realtime, fakeBackend, page }) => {
      await shell.goto('browse/mine/layouts-lab/dl.station');
      await expect(layout.frames).toHaveCount(4);

      const updated = structuredClone(fakeBackend.object('dl.station'));
      updated.composition = ['pwr.bus_v'];
      const reconciled = page.waitForRequest(savesDlStation);
      await realtime.pushObjectUpdate(updated);

      await expect(layout.frame('it-cam')).toHaveCount(0);
      await expect(layout.frames).toHaveCount(3);
      await reconciled;
    },
  );

  test(
    'OMCT-C09-L2-01.03 — moved and restacked items save their geometry on commit',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-01.03' }] },
    async ({ shell, layout, page }) => {
      await shell.goto('browse/mine/layouts-lab/dl.station');
      await expect(layout.frames).toHaveCount(4);

      await layout.canvas.click({ position: { x: 590, y: 300 } });
      await layout.toolbarControl('layout.edit').click();
      await expect(layout.canvas).toHaveAttribute('data-editing', 'true');

      // Drag the box item (at 200,220 px; 100x60) by +30/+20 px = +3/+2 grid units.
      await layout.dragBy(layout.frame('it-box'), 30, 20);
      await expect(layout.frame('it-box')).toHaveCSS('left', '230px');
      await expect(layout.frame('it-box')).toHaveCSS('top', '240px');

      await layout.frame('it-box').click();
      await layout.toolbarControl('layout.forward').click();

      const saved = page.waitForRequest(savesDlStation);
      await layout.toolbarControl('layout.save').click();
      await saved;
      await expect(layout.canvas).toHaveAttribute('data-editing', 'false');

      await shell.goto('browse/mine/layouts-lab/dl.station');
      await expect(layout.frame('it-box')).toHaveCSS('left', '230px');
      await expect(layout.frame('it-box')).toHaveCSS('top', '240px');
    },
  );

  test(
    'OMCT-C09-L2-01.04 — a layout item hosts the applicable view configured by its view key',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-01.04' }] },
    async ({ shell, layout, page }) => {
      await shell.goto('browse/mine/layouts-lab/dl.station');

      await expect(layout.frame('it-busv').getByTestId('table-view')).toBeVisible();
      await expect(page.getByTestId('imagery-view')).toBeVisible();
    },
  );

  test(
    'OMCT-C09-L2-01.05 — copied items paste as new items with valid object references',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-01.05' }] },
    async ({ shell, layout, page }) => {
      await shell.goto('browse/mine/layouts-lab/dl.station');
      await expect(layout.frames).toHaveCount(4);

      await layout.canvas.click({ position: { x: 590, y: 300 } });
      await layout.toolbarControl('layout.edit').click();
      await layout.frame('it-box').click();
      await layout.toolbarControl('layout.copy').click();
      await layout.toolbarControl('layout.paste').click();

      await expect(layout.frames).toHaveCount(5);
      await expect(layout.framesOfKind('box')).toHaveCount(2);

      const saved = page.waitForRequest(savesDlStation);
      await layout.toolbarControl('layout.save').click();
      await saved;

      await shell.goto('browse/mine/layouts-lab/dl.station');
      await expect(layout.framesOfKind('box')).toHaveCount(2);
    },
  );
});
