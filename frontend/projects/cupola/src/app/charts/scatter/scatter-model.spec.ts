import { readScatterConfig, scatterPoints } from './scatter-model';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

const datum = (fields: Record<string, unknown>): WideDatum =>
  ({ keyString: 'k', timestamp: '2026-07-13T18:00:00Z', value: 0, ...fields }) as WideDatum;

describe('readScatterConfig', () => {
  it('defaults to the first two range keys', () => {
    expect(readScatterConfig(undefined, ['current', 'voltage'])).toEqual({ xKey: 'current', yKey: 'voltage' });
  });

  it('honours stored axis keys', () => {
    expect(readScatterConfig({ scatter: { xKey: 'voltage', yKey: 'current' } }, ['current', 'voltage'])).toEqual({
      xKey: 'voltage',
      yKey: 'current',
    });
  });
});

describe('OMCT-C07-L2-04.04 Scatter axes', () => {
  it('positions each point from the two configured range values', () => {
    const points = scatterPoints(
      [datum({ current: 3, voltage: 28 }), datum({ current: 4, voltage: 30 })],
      { xKey: 'current', yKey: 'voltage' },
    );
    expect(points).toEqual([
      { x: 3, y: 28 },
      { x: 4, y: 30 },
    ]);
  });

  it('skips datums missing a range value', () => {
    expect(scatterPoints([datum({ current: 3 })], { xKey: 'current', yKey: 'voltage' })).toHaveLength(0);
  });
});
