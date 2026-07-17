import { Locator, Page } from '@playwright/test';

/** C09 layout surfaces: display-layout canvas, flexible layout, tabs, folders, web content. */
export class LayoutPage {
  constructor(readonly page: Page) {}

  // Display layout
  get canvas(): Locator {
    return this.page.getByTestId('dl-canvas');
  }

  get frames(): Locator {
    return this.page.getByTestId('dl-frame');
  }

  frame(itemId: string): Locator {
    return this.page.locator(`[data-testid="dl-frame"][data-item-id="${itemId}"]`);
  }

  framesOfKind(kind: string): Locator {
    return this.page.locator(`[data-testid="dl-frame"][data-kind="${kind}"]`);
  }

  handle(direction: string): Locator {
    return this.page.locator(`[data-testid="dl-handle"][data-handle="${direction}"]`);
  }

  toolbarControl(key: string): Locator {
    return this.page.locator(`[data-testid="toolbar-control"][data-key="${key}"]`);
  }

  /** Drags from the center of `target` by the given pixel offsets. */
  async dragBy(target: Locator, dx: number, dy: number): Promise<void> {
    const box = (await target.boundingBox())!;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + dx / 2, startY + dy / 2, { steps: 4 });
    await this.page.mouse.move(startX + dx, startY + dy, { steps: 4 });
    await this.page.mouse.up();
  }

  // Flexible layout
  get flexCanvas(): Locator {
    return this.page.getByTestId('fl-canvas');
  }

  get flexContainers(): Locator {
    return this.page.getByTestId('fl-container');
  }

  get flexPanes(): Locator {
    return this.page.getByTestId('fl-pane');
  }

  flexPane(keyString: string): Locator {
    return this.page.locator(`[data-testid="fl-pane"][data-key="${keyString}"]`);
  }

  get flexSplitters(): Locator {
    return this.page.getByTestId('fl-splitter');
  }

  // Tabs
  get tabs(): Locator {
    return this.page.getByTestId('tab');
  }

  tab(keyString: string): Locator {
    return this.page.locator(`[data-testid="tab"][data-key="${keyString}"]`);
  }

  get tabPanels(): Locator {
    return this.page.getByTestId('tab-panel');
  }

  tabPanel(keyString: string): Locator {
    return this.page.locator(`[data-testid="tab-panel"][data-key="${keyString}"]`);
  }

  get tabsEmpty(): Locator {
    return this.page.getByTestId('tabs-empty');
  }

  // Folder grid/list
  get folderToggle(): Locator {
    return this.page.getByTestId('folder-view-toggle');
  }

  get folderToggleList(): Locator {
    return this.page.getByTestId('folder-toggle-list');
  }

  get folderToggleGrid(): Locator {
    return this.page.getByTestId('folder-toggle-grid');
  }

  get listRows(): Locator {
    return this.page.getByTestId('child-row');
  }

  // Hyperlink / web page
  get hyperlink(): Locator {
    return this.page.getByTestId('hyperlink');
  }

  get webEmbed(): Locator {
    return this.page.getByTestId('web-embed');
  }

  get webEmbedError(): Locator {
    return this.page.getByTestId('web-embed-error');
  }
}
