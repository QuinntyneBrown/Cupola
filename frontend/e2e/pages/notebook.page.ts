import { Locator, Page } from '@playwright/test';

/** Page object for the C13 notebook view, entries, and annotation authoring. */
export class NotebookPage {
  readonly view: Locator;
  readonly sections: Locator;
  readonly pages: Locator;
  readonly addSection: Locator;
  readonly addPage: Locator;
  readonly defaultPin: Locator;
  readonly editor: Locator;
  readonly saveEntry: Locator;
  readonly searchInput: Locator;
  readonly entries: Locator;
  readonly entryBodies: Locator;
  readonly embeds: Locator;
  readonly blockedUrls: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('notebook-view');
    this.sections = page.getByTestId('notebook-section');
    this.pages = page.getByTestId('notebook-page');
    this.addSection = page.getByTestId('notebook-add-section');
    this.addPage = page.getByTestId('notebook-add-page');
    this.defaultPin = page.getByTestId('notebook-default-pin');
    this.editor = page.getByTestId('notebook-editor');
    this.saveEntry = page.getByTestId('notebook-save-entry');
    this.searchInput = page.getByTestId('notebook-search-input');
    this.entries = page.getByTestId('notebook-entry');
    this.entryBodies = page.getByTestId('notebook-entry-body');
    this.embeds = page.getByTestId('notebook-embed');
    this.blockedUrls = page.getByTestId('nb-blocked-url');
  }

  section(name: string): Locator {
    return this.page.locator(`[data-testid="notebook-section"][data-name="${name}"]`);
  }

  pageItem(name: string): Locator {
    return this.page.locator(`[data-testid="notebook-page"][data-name="${name}"]`);
  }

  entry(entryId: string): Locator {
    return this.page.locator(`[data-testid="notebook-entry"][data-entry-id="${entryId}"]`);
  }

  /** Types text into the entry editor and commits it via the save button. */
  async writeEntry(text: string): Promise<void> {
    await this.editor.fill(text);
    await this.saveEntry.click();
  }

  entryAuthor(entry: Locator): Locator {
    return entry.getByTestId('notebook-entry-author');
  }

  editEntry(entry: Locator): Locator {
    return entry.getByTestId('notebook-edit-entry');
  }

  deleteEntry(entry: Locator): Locator {
    return entry.getByTestId('notebook-delete-entry');
  }

  entryLink(entry: Locator): Locator {
    return entry.locator('a.cp-link');
  }
}
