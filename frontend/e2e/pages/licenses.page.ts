import { Locator, Page } from '@playwright/test';

/** Page object for the /licenses third-party license route. */
export class LicensesPage {
  readonly overlay: Locator;
  readonly title: Locator;
  readonly projectText: Locator;
  readonly thirdParty: Locator;
  readonly entries: Locator;

  constructor(readonly page: Page) {
    this.overlay = page.getByTestId('licenses-overlay');
    this.title = page.getByTestId('licenses-title');
    this.projectText = page.getByTestId('licenses-project-text');
    this.thirdParty = page.getByTestId('licenses-third-party');
    this.entries = page.getByTestId('licenses-entry');
  }
}
