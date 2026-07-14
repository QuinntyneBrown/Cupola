import { Locator, Page } from '@playwright/test';

/** Page object for the browse tree (region 2). */
export class TreePage {
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.rows = page.getByTestId('tree-row');
  }

  row(keyString: string): Locator {
    return this.page.locator(`[data-testid="tree-row"][data-key="${keyString}"]`);
  }

  label(keyString: string): Locator {
    return this.row(keyString).locator('.cp-tree-label');
  }

  selectedRow(): Locator {
    return this.page.locator('[data-testid="tree-row"].is-selected');
  }

  async expand(keyString: string): Promise<void> {
    await this.row(keyString).getByTestId('tree-chevron').click();
  }

  async activate(keyString: string): Promise<void> {
    await this.row(keyString).click();
  }
}
