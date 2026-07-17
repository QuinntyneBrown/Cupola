import { extent, linearScale, niceTicks } from './scale';

describe('linearScale', () => {
  it('maps the domain onto the pixel range', () => {
    const scale = linearScale(0, 10, 0, 100);
    expect(scale.scale(0)).toBe(0);
    expect(scale.scale(5)).toBe(50);
    expect(scale.scale(10)).toBe(100);
  });

  it('inverts the range for a top-down y axis', () => {
    const scale = linearScale(0, 10, 200, 0);
    expect(scale.scale(0)).toBe(200);
    expect(scale.scale(10)).toBe(0);
  });

  it('pads a degenerate domain so a single value still renders', () => {
    const scale = linearScale(5, 5, 0, 100);
    expect(scale.scale(5)).toBe(50);
  });
});

describe('niceTicks', () => {
  it('produces rounded ticks spanning the extent (02.03)', () => {
    const ticks = niceTicks(28, 34, 4);
    expect(ticks[0]).toBeLessThanOrEqual(28);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(34);
    expect(ticks).toContain(30);
    // Evenly spaced by a rounded interval.
    expect(ticks[1] - ticks[0]).toBe(ticks[2] - ticks[1]);
  });

  it('handles a flat series', () => {
    expect(niceTicks(5, 5)).toEqual([4, 5, 6]);
  });
});

describe('extent', () => {
  it('returns the min and max', () => {
    expect(extent([3, 1, 2])).toEqual({ min: 1, max: 3 });
  });

  it('returns a unit range when empty', () => {
    expect(extent([])).toEqual({ min: 0, max: 1 });
  });
});
