import { DomainObject } from '@cupola/core';

export type LegendMode = 'collapsed' | 'expanded';
export type YAxisMode = 'single' | 'per-series';
export type Interpolation = 'linear' | 'step';
export type LineStyle = 'solid' | 'dashed' | 'none';
export type PointStyle = 'none' | 'dot';

/** Per-series style overrides keyed by the series' telemetry keyString (03.04). */
export interface SeriesStyle {
  colorSlot?: number;
  interpolation?: Interpolation;
  lineStyle?: LineStyle;
  pointStyle?: PointStyle;
}

/** The persisted plot configuration under `configuration.plot`. */
export interface PlotConfiguration {
  legend: LegendMode;
  grid: boolean;
  limitLines: boolean;
  yAxisMode: YAxisMode;
  series: Record<string, SeriesStyle>;
}

/** Fully resolved style for one rendered series. */
export interface ResolvedSeriesStyle {
  color: string;
  interpolation: Interpolation;
  lineStyle: LineStyle;
  pointStyle: PointStyle;
}

export const PLOT_CONFIG_FAMILY = 'plot';

export const PLOT_DEFAULTS: PlotConfiguration = {
  legend: 'collapsed',
  grid: true,
  limitLines: false,
  yAxisMode: 'single',
  series: {},
};

/** The eight fixed categorical chart slots, `var(--cp-chart-1…8)`. */
export function chartColor(slot: number): string {
  const index = ((Math.max(1, Math.round(slot)) - 1) % 8) + 1;
  return `var(--cp-chart-${index})`;
}

/** Reads `configuration.plot`, merged over the defaults. */
export function readPlotConfig(object: DomainObject): PlotConfiguration {
  const stored = (object.configuration?.[PLOT_CONFIG_FAMILY] ?? {}) as Partial<PlotConfiguration>;
  return {
    legend: stored.legend ?? PLOT_DEFAULTS.legend,
    grid: stored.grid ?? PLOT_DEFAULTS.grid,
    limitLines: stored.limitLines ?? PLOT_DEFAULTS.limitLines,
    yAxisMode: stored.yAxisMode ?? PLOT_DEFAULTS.yAxisMode,
    series: stored.series ?? {},
  };
}

/** Resolves the effective style for a series, defaulting the colour to its slot. */
export function resolveSeriesStyle(
  config: PlotConfiguration,
  keyString: string,
  index: number,
): ResolvedSeriesStyle {
  const style = config.series[keyString] ?? {};
  return {
    color: chartColor(style.colorSlot ?? index + 1),
    interpolation: style.interpolation ?? 'linear',
    lineStyle: style.lineStyle ?? 'solid',
    pointStyle: style.pointStyle ?? 'none',
  };
}
