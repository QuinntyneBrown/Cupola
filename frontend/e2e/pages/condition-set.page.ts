import { Locator, Page } from '@playwright/test';

/** Page object for the C10 condition set, widgets, derived views, and filters. */
export class ConditionSetPage {
  readonly view: Locator;
  readonly activeOutput: Locator;
  readonly addCondition: Locator;
  readonly widget: Locator;
  readonly widgetLabel: Locator;
  readonly summaryPreview: Locator;
  readonly summaryEdit: Locator;
  readonly summaryTestToggle: Locator;
  readonly derivedValue: Locator;
  readonly filterRadios: Locator;
  readonly filterCheckboxes: Locator;
  readonly filterTexts: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('condition-set-view');
    this.activeOutput = page.getByTestId('condition-active-output');
    this.addCondition = page.getByTestId('condition-add');
    this.widget = page.getByTestId('condition-widget-view');
    this.widgetLabel = page.getByTestId('condition-widget-label');
    this.summaryPreview = page.getByTestId('summary-widget-preview');
    this.summaryEdit = page.getByTestId('summary-widget-edit');
    this.summaryTestToggle = page.getByTestId('summary-test-toggle');
    this.derivedValue = page.getByTestId('derived-value');
    this.filterRadios = page.getByTestId('filter-radio');
    this.filterCheckboxes = page.getByTestId('filter-checkbox');
    this.filterTexts = page.getByTestId('filter-text');
  }

  conditionRow(id: string): Locator {
    return this.page.locator(`[data-testid="condition-row"][data-key="${id}"]`);
  }

  activeBadge(id: string): Locator {
    return this.conditionRow(id).getByTestId('condition-active-badge');
  }

  conditionOutput(id: string): Locator {
    return this.page.locator(`[data-testid="condition-output"][data-key="${id}"]`);
  }

  filterRadio(value: string): Locator {
    return this.page.locator(`[data-testid="filter-radio"][data-value="${value}"]`);
  }

  summaryTestInput(keyString: string): Locator {
    return this.page.locator(`[data-testid="summary-test-input"][data-key="${keyString}"]`);
  }

  /** Waits for a view to mount, then lets async telemetry subscriptions settle. */
  async settle(): Promise<void> {
    await this.page.waitForTimeout(400);
  }
}
