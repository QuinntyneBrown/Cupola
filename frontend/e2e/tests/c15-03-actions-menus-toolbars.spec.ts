import { expect, test } from '../support/cupola.fixture';

test.describe('C15 L1-03 — Actions, menus, and toolbars', () => {
  test(
    'OMCT-C15-L2-03.01 — the context menu lists the actions applicable to the object',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-03.01' }] },
    async ({ shell, tree, contextMenu }) => {
      await shell.goto('browse/station');
      await tree.expand('station');
      await tree.expand('power');

      // Telemetry row: Open and View as table both apply.
      await tree.row('pwr.bus_v').click({ button: 'right' });
      await expect(contextMenu.menu).toBeVisible();
      await expect(contextMenu.item('Open')).toBeVisible();
      await expect(contextMenu.item('View as table')).toBeVisible();
      await shell.page.keyboard.press('Escape');

      // Folder row: only Open applies (View as table does not).
      await tree.row('power').click({ button: 'right' });
      await expect(contextMenu.item('Open')).toBeVisible();
      await expect(contextMenu.item('View as table')).toHaveCount(0);
    },
  );

  test(
    'OMCT-C15-L2-03.03 — clicking a menu item invokes it and dismisses the menu',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-03.03' }] },
    async ({ shell, tree, contextMenu, objectView, page }) => {
      await shell.goto('browse/station');
      await tree.expand('station');
      await tree.expand('power');

      await tree.row('pwr.bus_v').click({ button: 'right' });
      await contextMenu.item('Open').click();

      await expect(page).toHaveURL(/#\/browse\/station\/power\/pwr\.bus_v$/);
      await expect(objectView.title).toHaveText('Bus voltage');
      await expect(contextMenu.menu).toHaveCount(0);
    },
  );

  test(
    'OMCT-C15-L2-03.04 — the Create super menu shows a description for the focused item',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-03.04' }] },
    async ({ shell, contextMenu, page }) => {
      await shell.goto('browse/mine');

      await page.getByTestId('create-button').click();
      await expect(contextMenu.superMenu).toBeVisible();

      await contextMenu.superItem('Folder').hover();
      await expect(contextMenu.superMenuDescription).toContainText(
        'A container for organizing objects',
      );

      await contextMenu.superItem('Overlay Plot').hover();
      await expect(contextMenu.superMenuDescription).toContainText('telemetry series');
    },
  );

  test(
    'OMCT-C15-L2-03.05 — the toolbar aggregates controls that apply to the selection',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-03.05' }] },
    async ({ shell, page }) => {
      // Telemetry selection: the pause control appears.
      await shell.goto('browse/station/power/pwr.bus_v');
      const control = page.getByTestId('toolbar-control');
      await expect(control).toHaveCount(1);
      await expect(control).toHaveAttribute('data-key', 'playback');

      // Folder selection: no telemetry controls.
      await shell.goto('browse/mine');
      await expect(page.getByTestId('toolbar-control')).toHaveCount(0);
    },
  );
});
