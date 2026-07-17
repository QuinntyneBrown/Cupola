import { Request } from '@playwright/test';

import { expect, test } from '../support/cupola.fixture';

const savesFlStation = (request: Request): boolean =>
  request.method() === 'POST' &&
  request.url().includes('/api/objects') &&
  (request.postData() ?? '').includes('fl.station');

test.describe('C09 L1-02 — Flexible layouts', () => {
  test(
    'OMCT-C09-L2-02.01 — configured children render in their assigned panes',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-02.01' }] },
    async ({ shell, layout }) => {
      await shell.goto('browse/mine/layouts-lab/fl.station');

      await expect(layout.flexCanvas).toBeVisible();
      await expect(layout.flexContainers).toHaveCount(2);
      const topPanes = layout.flexContainers.nth(0).getByTestId('fl-pane');
      await expect(topPanes).toHaveCount(2);
      await expect(topPanes.nth(0)).toHaveAttribute('data-key', 'pwr.bus_v');
      await expect(topPanes.nth(1)).toHaveAttribute('data-key', 'pwr.array_out');
      await expect(layout.flexContainers.nth(1).getByTestId('fl-pane')).toHaveAttribute(
        'data-key',
        'cam.cupola',
      );
    },
  );

  test(
    'OMCT-C09-L2-02.02 — pane toolbar controls update and persist the layout configuration',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-02.02' }] },
    async ({ shell, layout, page }) => {
      await shell.goto('browse/mine/layouts-lab/fl.station');
      await expect(layout.flexContainers).toHaveCount(2);

      await layout.flexPane('cam.cupola').click();
      await layout.toolbarControl('flexible.edit').click();
      await expect(layout.flexCanvas).toHaveAttribute('data-editing', 'true');

      let saved = page.waitForRequest(savesFlStation);
      await layout.toolbarControl('flexible.add-container').click();
      await expect(layout.flexContainers).toHaveCount(3);
      await saved;

      saved = page.waitForRequest(savesFlStation);
      await layout.toolbarControl('flexible.orientation').click();
      await saved;

      await layout.flexPane('pwr.array_out').click();
      saved = page.waitForRequest(savesFlStation);
      await layout.toolbarControl('flexible.remove-frame').click();
      await expect(layout.flexPane('pwr.array_out')).toHaveCount(0);
      await saved;

      // The edits survive reload — the configuration persisted per invocation.
      await shell.goto('browse/mine/layouts-lab/fl.station');
      await expect(layout.flexContainers).toHaveCount(3);
      await expect(layout.flexPane('pwr.array_out')).toHaveCount(0);
    },
  );

  test(
    'OMCT-C09-L2-02.03 — saved styles apply to their target panes',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-02.03' }] },
    async ({ shell, layout }) => {
      await shell.goto('browse/mine/layouts-lab/fl.station');

      const styled = layout.flexPane('pwr.array_out');
      await expect(styled).toHaveClass(/fl-pane--styled/);
      await expect(styled).toHaveCSS('background-color', 'rgb(20, 40, 60)');
    },
  );
});
