import { Locator, Page } from '@playwright/test';

/** Page object for stacked overlays (scrim + dialog container). */
export class OverlayPage {
  readonly scrims: Locator;
  readonly containers: Locator;

  constructor(readonly page: Page) {
    this.scrims = page.getByTestId('overlay-scrim');
    this.containers = page.getByTestId('overlay-container');
  }

  top(): Locator {
    return this.containers.last();
  }

  preview(): Locator {
    return this.page.getByTestId('preview');
  }
}
