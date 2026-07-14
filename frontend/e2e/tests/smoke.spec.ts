import { expect, test } from '../support/cupola.fixture';

test.describe('Cupola shell smoke', () => {
  test('shell renders all six regions with the darkmatter theme installed', async ({ shell }) => {
    await shell.goto();

    await expect(shell.appBar).toBeVisible();
    await expect(shell.treePane).toBeVisible();
    await expect(shell.mainPane).toBeVisible();
    await expect(shell.inspectorPane).toBeVisible();
    await expect(shell.conductor).toBeVisible();
    await expect(shell.statusBar).toBeVisible();

    await expect(shell.themeLink).toHaveCount(1);
    await expect(shell.themeLink).toHaveAttribute('href', /theme-darkmatter\.css$/);
    await expect(shell.connectionIndicator).toContainText('Connected');
  });
});
