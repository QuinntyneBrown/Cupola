import { Locator, Page } from '@playwright/test';

/** Page object for the about dialog. */
export class AboutDialogPage {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly version: Locator;
  readonly revision: Locator;
  readonly license: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByTestId('about-dialog');
    this.title = page.getByTestId('about-title');
    this.version = page.getByTestId('about-version');
    this.revision = page.getByTestId('about-revision');
    this.license = page.getByTestId('about-license');
  }
}
