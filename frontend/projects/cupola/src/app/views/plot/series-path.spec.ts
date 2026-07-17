import { linePath, projectSeries } from './series-path';
import { linearScale } from './scale';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

const datum = (timestamp: number, value: number, extra: Record<string, unknown> = {}): WideDatum =>
  ({ keyString: 'k', timestamp: new Date(timestamp).toISOString(), value, ...extra }) as WideDatum;

describe('projectSeries', () => {
  const xScale = linearScale(0, 100, 0, 200);
  const yScale = linearScale(0, 10, 100, 0);

  it('maps timestamp and value into pixels', () => {
    const projected = projectSeries([datum(50, 5)], xScale, yScale);
    expect(projected[0]).toMatchObject({ x: 100, y: 50, value: 5 });
  });

  it('clamps a leading-edge sample to the plot area (02.02)', () => {
    const projected = projectSeries([datum(150, 5)], xScale, yScale);
    expect(projected[0].x).toBe(200);
  });

  it('reads an alternate range key for scatter/spectral data (04.04)', () => {
    const projected = projectSeries([datum(50, 5, { voltage: 8 })], xScale, yScale, 'voltage');
    expect(projected[0].y).toBe(20);
  });

  it('skips non-finite values', () => {
    expect(projectSeries([datum(50, Number.NaN)], xScale, yScale)).toHaveLength(0);
  });
});

describe('linePath', () => {
  const points = [
    { x: 0, y: 0, value: 0, timestamp: 0 },
    { x: 10, y: 20, value: 0, timestamp: 0 },
  ];

  it('draws a linear path', () => {
    expect(linePath(points, 'linear')).toBe('M0,0L10,20');
  });

  it('draws a stepped path', () => {
    expect(linePath(points, 'step')).toBe('M0,0L10,0L10,20');
  });

  it('returns an empty path for no points', () => {
    expect(linePath([], 'linear')).toBe('');
  });
});
