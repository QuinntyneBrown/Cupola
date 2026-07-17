import { Locator, Page } from '@playwright/test';

/** C11 imagery surfaces: focused image, thumbnails, controls, annotations, track. */
export class ImageryPage {
  constructor(readonly page: Page) {}

  get view(): Locator {
    return this.page.getByTestId('imagery-view');
  }

  get focusedImage(): Locator {
    return this.page.getByTestId('focused-image');
  }

  get frameTime(): Locator {
    return this.page.getByTestId('frame-time');
  }

  get liveBadge(): Locator {
    return this.page.getByTestId('imagery-live');
  }

  get thumbs(): Locator {
    return this.page.getByTestId('imagery-thumb');
  }

  thumb(time: number): Locator {
    return this.page.locator(`[data-testid="imagery-thumb"][data-time="${time}"]`);
  }

  control(
    key:
      | 'zoom-in'
      | 'zoom-out'
      | 'zoom-reset'
      | 'filters-toggle'
      | 'layers-toggle'
      | 'open-new-tab'
      | 'save',
  ): Locator {
    return this.page.getByTestId(`imagery-${key}`);
  }

  get stage(): Locator {
    return this.page.locator('.im-stage');
  }

  get viewableArea(): Locator {
    return this.page.getByTestId('viewable-area');
  }

  get viewableAreaRegion(): Locator {
    return this.page.getByTestId('viewable-area-region');
  }

  get brightness(): Locator {
    return this.page.getByTestId('imagery-brightness');
  }

  get contrast(): Locator {
    return this.page.getByTestId('imagery-contrast');
  }

  get filtersReset(): Locator {
    return this.page.getByTestId('imagery-filters-reset');
  }

  layerToggle(key: string): Locator {
    return this.page.locator(`[data-testid="imagery-layer-toggle"][data-layer="${key}"]`);
  }

  layerOverlay(key: string): Locator {
    return this.page.locator(`[data-testid="image-layer"][data-layer="${key}"]`);
  }

  get compass(): Locator {
    return this.page.getByTestId('imagery-compass');
  }

  get compassHud(): Locator {
    return this.page.getByTestId('compass-hud');
  }

  get relatedRows(): Locator {
    return this.page.getByTestId('imagery-related-row');
  }

  get annotations(): Locator {
    return this.page.getByTestId('image-annotation');
  }

  annotation(keyString: string): Locator {
    return this.page.locator(`[data-testid="image-annotation"][data-key="${keyString}"]`);
  }

  get trackThumbs(): Locator {
    return this.page.getByTestId('imagery-track-thumb');
  }
}
