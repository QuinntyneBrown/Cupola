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
    // Exact match on the item label, so e.g. 'Open' does not also match
    // 'Open in a new tab' (menus grew with C03 authoring actions).
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.items.filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) });
  }

  superItem(name: string): Locator {
    return this.page.locator(`[data-testid="super-menu-item"][data-name="${name}"]`);
  }
}
