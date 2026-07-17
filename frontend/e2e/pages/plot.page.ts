import { Locator, Page } from '@playwright/test';

/** Page object for C07 plot, stacked, bar, and scatter views. */
export class PlotPage {
  readonly view: Locator;
  readonly svg: Locator;
  readonly seriesLines: Locator;
  readonly xTicks: Locator;
  readonly yTicks: Locator;
  readonly zoomIn: Locator;
  readonly zoomOut: Locator;
  readonly pan: Locator;
  readonly reset: Locator;
  readonly pause: Locator;
  readonly pausedChip: Locator;
  readonly legendToggle: Locator;
  readonly legend: Locator;
  readonly legendTable: Locator;
  readonly legendKeys: Locator;
  readonly limitLines: Locator;
  readonly alarmPoints: Locator;
  readonly seriesAxes: Locator;
  readonly stackedRows: Locator;
  readonly stackedCursor: Locator;
  readonly stackedCursorPoints: Locator;
  readonly bars: Locator;
  readonly scatterPoints: Locator;
  readonly toolbar: Locator;

  constructor(readonly page: Page) {
    this.view = page.getByTestId('plot-view');
    this.svg = page.getByTestId('plot-svg');
    this.seriesLines = page.getByTestId('plot-series-line');
    this.xTicks = page.getByTestId('plot-x-tick');
    this.yTicks = page.getByTestId('plot-y-tick');
    this.zoomIn = page.getByTestId('plot-zoom-in');
    this.zoomOut = page.getByTestId('plot-zoom-out');
    this.pan = page.getByTestId('plot-pan');
    this.reset = page.getByTestId('plot-reset');
    this.pause = page.getByTestId('plot-pause');
    this.pausedChip = page.getByTestId('plot-paused');
    this.legendToggle = page.getByTestId('plot-legend-toggle');
    this.legend = page.getByTestId('plot-legend');
    this.legendTable = page.getByTestId('plot-legend-table');
    this.legendKeys = page.getByTestId('plot-key');
    this.limitLines = page.getByTestId('plot-limit-line');
    this.alarmPoints = page.getByTestId('plot-alarm-point');
    this.seriesAxes = page.getByTestId('plot-series-axis');
    this.stackedRows = page.getByTestId('stacked-row');
    this.stackedCursor = page.getByTestId('stacked-cursor');
    this.stackedCursorPoints = page.getByTestId('stacked-cursor-point');
    this.bars = page.getByTestId('bar');
    this.scatterPoints = page.getByTestId('scatter-point');
    this.toolbar = page.getByTestId('plot-toolbar');
  }

  seriesLine(keyString: string): Locator {
    return this.page.locator(`[data-testid="plot-series-line"][data-key="${keyString}"]`);
  }

  colorSwatch(seriesKey: string, slot: number): Locator {
    return this.page.locator(
      `[data-testid="plot-series-row"][data-key="${seriesKey}"] [data-testid="plot-series-color"][data-slot="${slot}"]`,
    );
  }

  yAxisOption(value: string): Locator {
    return this.page.locator(`[data-testid="plot-opt-yaxis"][data-value="${value}"]`);
  }

  /** Reads the rendered sample count of a series line. */
  async seriesCount(keyString: string): Promise<number> {
    const value = await this.seriesLine(keyString).getAttribute('data-count');
    return Number(value ?? 0);
  }
}
