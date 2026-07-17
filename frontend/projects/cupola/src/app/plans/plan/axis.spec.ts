import { buildAxisTicks } from './axis';
import { createTimeScale } from './time-scale';

describe('OMCT-C12-L2-02.02 Shared time axis', () => {
  const bounds = { start: 1000, end: 7000 };
  const formatTime = (value: number): string => String(value);

  it('builds a shared axis spanning the bounds edge to edge', () => {
    const ticks = buildAxisTicks(bounds, formatTime, 6);
    expect(ticks).toHaveLength(7);
    expect(ticks[0].leftPct).toBe(0);
    expect(ticks[6].leftPct).toBe(100);
    expect(ticks[0].label).toBe('1000');
    expect(ticks[6].label).toBe('7000');
  });

  it('spaces ticks evenly across the axis', () => {
    const ticks = buildAxisTicks(bounds, formatTime, 6);
    const expected = [0, 100 / 6, 200 / 6, 50, 400 / 6, 500 / 6, 100];
    ticks.forEach((tick, index) => expect(tick.leftPct).toBeCloseTo(expected[index], 6));
  });

  it('places a child event on the same axis offset as the shared scale', () => {
    // A child aligns to the strip axis when it positions data by the shared
    // scale: the axis midpoint tick and the scale agree on the midpoint time.
    const ticks = buildAxisTicks(bounds, formatTime, 2);
    const scale = createTimeScale(bounds);
    const midTime = (bounds.start + bounds.end) / 2;
    expect(ticks[1].leftPct).toBe(50);
    expect(scale.offset(midTime)).toBe(50);
  });

  it('returns no ticks for degenerate bounds', () => {
    expect(buildAxisTicks({ start: 5, end: 5 }, formatTime)).toEqual([]);
  });
});
