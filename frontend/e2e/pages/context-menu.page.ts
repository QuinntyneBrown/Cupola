import { Locator, Page } from '@playwright/test';

/** Page object for the context menu and Create super-menu. */
export class ContextMenuPage {
  readonly menu: Locator;
  readonly items: Locator;
  readonly superMenu: Locator;
  readonly superMenuItems: Locator;
  readonly superMenuDescription: Locator;

  constructor(readonly page: Page) {
    this.menu = page.getByTestId('menu');
    this.items = page.getByTestId('menu-item');
    this.superMenu = page.getByTestId('super-menu');
    this.superMenuItems = page.getByTestId('super-menu-item');
    this.superMenuDescription = page.getByTestId('super-menu-desc');
  }

  item(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  superItem(name: string): Locator {
    return this.page.locator(`[data-testid="super-menu-item"][data-name="${name}"]`);
  }
}
