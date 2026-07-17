import { DomainObject } from '@cupola/core';

import { chartColor, readPlotConfig, resolveSeriesStyle } from './plot-config';

function object(configuration?: Record<string, unknown>): DomainObject {
  return {
    identifier: { namespace: '', key: 'p' },
    keyString: 'p',
    name: 'Plot',
    type: 'overlay-plot',
    location: null,
    composition: [],
    configuration,
  };
}

describe('readPlotConfig', () => {
  it('returns the defaults when unconfigured', () => {
    expect(readPlotConfig(object())).toEqual({
      legend: 'collapsed',
      grid: true,
      limitLines: false,
      yAxisMode: 'single',
      series: {},
    });
  });

  it('merges stored options over the defaults', () => {
    const config = readPlotConfig(object({ plot: { grid: false, yAxisMode: 'per-series' } }));
    expect(config.grid).toBe(false);
    expect(config.yAxisMode).toBe('per-series');
    expect(config.legend).toBe('collapsed');
  });
});

describe('chartColor', () => {
  it('maps slots to the fixed categorical chart variables', () => {
    expect(chartColor(1)).toBe('var(--cp-chart-1)');
    expect(chartColor(8)).toBe('var(--cp-chart-8)');
  });

  it('wraps past slot 8', () => {
    expect(chartColor(9)).toBe('var(--cp-chart-1)');
  });
});

describe('resolveSeriesStyle', () => {
  it('defaults a series colour to its slot index', () => {
    const style = resolveSeriesStyle(readPlotConfig(object()), 'a', 1);
    expect(style.color).toBe('var(--cp-chart-2)');
    expect(style.interpolation).toBe('linear');
    expect(style.lineStyle).toBe('solid');
  });

  it('applies a configured series style (03.04)', () => {
    const config = readPlotConfig(
      object({ plot: { series: { a: { colorSlot: 5, interpolation: 'step', lineStyle: 'dashed', pointStyle: 'dot' } } } }),
    );
    expect(resolveSeriesStyle(config, 'a', 0)).toEqual({
      color: 'var(--cp-chart-5)',
      interpolation: 'step',
      lineStyle: 'dashed',
      pointStyle: 'dot',
    });
  });
});
