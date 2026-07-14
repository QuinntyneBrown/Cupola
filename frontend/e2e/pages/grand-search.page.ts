import { Locator, Page } from '@playwright/test';

/** Page object for the grand search field and results panel. */
export class GrandSearchPage {
  readonly input: Locator;
  readonly results: Locator;
  readonly objectResults: Locator;
  readonly annotationResults: Locator;
  readonly marks: Locator;

  constructor(readonly page: Page) {
    this.input = page.getByTestId('search-input');
    this.results = page.getByTestId('search-results');
    this.objectResults = page.getByTestId('object-result');
    this.annotationResults = page.getByTestId('annotation-result');
    this.marks = page.locator('[data-testid="search-results"] mark');
  }

  async search(term: string): Promise<void> {
    await this.input.click();
    await this.input.fill(term);
  }
}
