import { Locator, Page } from '@playwright/test';

/**
 * Page object for the six-region shell frame.
 */
export class AppShellPage {
  readonly appBar: Locator;
  readonly appLogo: Locator;
  readonly treePane: Locator;
  readonly mainPane: Locator;
  readonly inspectorPane: Locator;
  readonly conductor: Locator;
  readonly statusBar: Locator;
  readonly connectionIndicator: Locator;
  readonly themeLink: Locator;

  constructor(readonly page: Page) {
    this.appBar = page.getByTestId('app-bar');
    this.appLogo = page.getByTestId('app-logo');
    this.treePane = page.getByTestId('tree-pane');
    this.mainPane = page.getByTestId('main-pane');
    this.inspectorPane = page.getByTestId('inspector-pane');
    this.conductor = page.getByTestId('conductor');
    this.statusBar = page.getByTestId('status-bar');
    this.connectionIndicator = page.getByTestId('connection-indicator');
    this.themeLink = page.locator('head link[data-cp-theme]');
  }

  async goto(hashPath = ''): Promise<void> {
    await this.page.goto(`/#/${hashPath.replace(/^\/+/, '')}`);
  }

  bodyClasses(): Promise<string> {
    return this.page.evaluate(() => document.body.className);
  }
}
