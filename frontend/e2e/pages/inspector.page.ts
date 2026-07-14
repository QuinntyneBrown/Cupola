import { Locator, Page } from '@playwright/test';

/** Page object for the inspector pane (region 4). */
export class InspectorPage {
  readonly tabs: Locator;
  readonly content: Locator;

  constructor(readonly page: Page) {
    this.tabs = page.getByTestId('inspector-tab');
    this.content = page.getByTestId('inspector-content');
  }

  tab(key: string): Locator {
    return this.page.locator(`[data-testid="inspector-tab"][data-key="${key}"]`);
  }

  async openTab(key: string): Promise<void> {
    await this.tab(key).click();
  }

  section(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
}
