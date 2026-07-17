import { Locator, Page } from '@playwright/test';

/** Page object for C08 telemetry table, LAD, gauge, autoflow, and datum views. */
export class TelemetryTablePage {
  // Telemetry table
  readonly view: Locator;
  readonly rows: Locator;
  readonly progress: Locator;
  readonly paused: Locator;
  readonly pause: Locator;
  readonly exportButton: Locator;
  readonly exportMenu: Locator;
  readonly exportAll: Locator;
  readonly exportMarked: Locator;
  readonly columnsButton: Locator;
  readonly columnMenu: Locator;

  // LAD
  readonly ladTable: Locator;
  readonly ladRows: Locator;
  readonly ladGroups: Locator;

  // Gauge
  readonly gauge: Locator;
  readonly gaugeForm: Locator;
  readonly gaugeValue: Locator;

  // Autoflow
  readonly autoflow: Locator;
  readonly autoflowRows: Locator;

  // Datum detail overlay
  readonly datumDetail: Locator;
  readonly datumRows: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('table-view');
    this.rows = page.getByTestId('table-row');
    this.progress = page.getByTestId('table-progress');
    this.paused = page.getByTestId('table-paused');
    this.pause = page.getByTestId('table-pause');
    this.exportButton = page.getByTestId('table-export');
    this.exportMenu = page.getByTestId('table-export-menu');
    this.exportAll = page.getByTestId('table-export-all');
    this.exportMarked = page.getByTestId('table-export-marked');
    this.columnsButton = page.getByTestId('table-columns-btn');
    this.columnMenu = page.getByTestId('table-column-menu');

    this.ladTable = page.getByTestId('lad-table');
    this.ladRows = page.getByTestId('lad-row');
    this.ladGroups = page.getByTestId('lad-group');

    this.gauge = page.getByTestId('gauge-view');
    this.gaugeForm = page.getByTestId('gauge-form');
    this.gaugeValue = page.getByTestId('gauge-value');

    this.autoflow = page.getByTestId('autoflow-view');
    this.autoflowRows = page.getByTestId('autoflow-row');

    this.datumDetail = page.getByTestId('datum-detail');
    this.datumRows = page.getByTestId('datum-detail-row');
  }

  sortHeader(column: string): Locator {
    return this.page.locator(`[data-testid="table-sort"][data-col="${column}"]`);
  }

  filterInput(column: string): Locator {
    return this.page.locator(`[data-testid="table-filter"][data-col="${column}"]`);
  }

  columnToggle(column: string): Locator {
    return this.page.locator(`[data-testid="table-column-toggle"][data-key="${column}"]`);
  }

  ladRow(keyString: string): Locator {
    return this.page.locator(
      `[data-testid="lad-row"][data-key="${keyString}"] [data-testid="lad-value"]`,
    );
  }

  autoflowRow(keyString: string): Locator {
    return this.page.locator(
      `[data-testid="autoflow-row"][data-key="${keyString}"] [data-testid="autoflow-value"]`,
    );
  }

  /** The rendered row count (visible rows). */
  async rowCount(): Promise<number> {
    return this.rows.count();
  }
}
