import { expect, test } from '../support/cupola.fixture';

test.describe('C09 L1-03 — Tabs and folders', () => {
  test(
    'OMCT-C09-L2-03.01 — a tabs object shows one selectable tab per child and the active child view',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-03.01' }] },
    async ({ shell, layout }) => {
      await shell.goto('browse/mine/layouts-lab/tabs.ops');

      await expect(layout.tabs).toHaveCount(2);
      await expect(layout.tab('pwr.bus_v')).toHaveAttribute('aria-selected', 'true');
      await expect(layout.tab('cam.cupola')).toHaveAttribute('aria-selected', 'false');
      await expect(layout.tabPanel('pwr.bus_v')).toBeVisible();

      await layout.tab('cam.cupola').click();
      await expect(layout.tab('cam.cupola')).toHaveAttribute('aria-selected', 'true');
      await expect(layout.tabPanel('cam.cupola')).toBeVisible();
    },
  );

  test(
    'OMCT-C09-L2-03.02 — inactive tab views retain or destroy per the saved loading policy',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-03.02' }] },
    async ({ shell, layout }) => {
      // Without a retention policy the deactivated view destroys.
      await shell.goto('browse/mine/layouts-lab/tabs.ops');
      await expect(layout.tabPanel('pwr.bus_v')).toBeVisible();
      await layout.tab('cam.cupola').click();
      await expect(layout.tabPanel('pwr.bus_v')).toHaveCount(0);

      // Keep-alive retains the deactivated view in the DOM, hidden.
      await shell.goto('browse/mine/layouts-lab/tabs.keep');
      await expect(layout.tabPanel('pwr.bus_v')).toBeVisible();
      await layout.tab('pwr.array_out').click();
      await expect(layout.tabPanel('pwr.array_out')).toBeVisible();
      await expect(layout.tabPanel('pwr.bus_v')).toBeAttached();
      await expect(layout.tabPanel('pwr.bus_v')).toBeHidden();
    },
  );

  test(
    'OMCT-C09-L2-03.03 — an empty tabs object displays its configured empty-state message',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-03.03' }] },
    async ({ shell, layout }) => {
      await shell.goto('browse/mine/layouts-lab/tabs.empty');

      await expect(layout.tabsEmpty).toContainText('No station displays composed yet.');
      await expect(layout.tabs).toHaveCount(0);
    },
  );

  test(
    'OMCT-C09-L2-03.04 — a folder renders every child in the selected grid or list presentation',
    { annotation: [{ type: 'requirement', description: 'OMCT-C09-L2-03.04' }] },
    async ({ shell, layout, objectView, page }) => {
      await shell.goto('browse/mine/layouts-lab');

      await expect(objectView.childCards).toHaveCount(9);
      await expect(layout.folderToggle).toBeVisible();

      await layout.folderToggleList.click();
      await expect(page).toHaveURL(/view=list/);
      await expect(layout.listRows).toHaveCount(9);
      await expect(layout.listRows.first()).toContainText('Station layout');
      await expect(layout.listRows.first()).toContainText('Display Layout');
      await expect(objectView.childCards).toHaveCount(0);

      await layout.folderToggleGrid.click();
      await expect(objectView.childCards).toHaveCount(9);
    },
  );
});
