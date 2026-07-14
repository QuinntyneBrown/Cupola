import { Locator, Page } from '@playwright/test';

/** Page object for the overlay form dialog. */
export class FormDialogPage {
  readonly form: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    this.form = page.getByTestId('form');
    this.saveButton = page.getByTestId('form-save');
    this.cancelButton = page.getByTestId('form-cancel');
  }

  control(key: string): Locator {
    return this.page.locator(`[data-testid="form-control"][data-key="${key}"]`);
  }

  async fill(key: string, value: string): Promise<void> {
    await this.control(key).fill(value);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
