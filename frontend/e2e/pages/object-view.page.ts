import { Locator, Page } from '@playwright/test';

/** Page object for the main view (region 3): object toolbar + view host. */
export class ObjectViewPage {
  readonly toolbar: Locator;
  readonly title: Locator;
  readonly breadcrumb: Locator;
  readonly viewHost: Locator;
  readonly childCards: Locator;

  constructor(readonly page: Page) {
    this.toolbar = page.getByTestId('object-toolbar');
    this.title = page.getByTestId('object-title');
    this.breadcrumb = page.getByTestId('breadcrumb');
    this.viewHost = page.getByTestId('object-view');
    this.childCards = page.getByTestId('child-card');
  }

  childCard(keyString: string): Locator {
    return this.page.locator(`[data-testid="child-card"][data-key="${keyString}"]`);
  }
}
