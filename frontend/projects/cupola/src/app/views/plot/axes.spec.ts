import { buildTicks, timeTickValues } from './axes';
import { linearScale } from './scale';

describe('timeTickValues', () => {
  it('spreads ticks evenly across the bounds (02.03)', () => {
    expect(timeTickValues({ start: 0, end: 100 }, 5)).toEqual([0, 25, 50, 75, 100]);
  });

  it('collapses to a single tick for an empty span', () => {
    expect(timeTickValues({ start: 10, end: 10 }, 5)).toEqual([10]);
  });
});

describe('buildTicks', () => {
  it('positions and labels each tick via the scale', () => {
    const scale = linearScale(0, 100, 0, 200);
    const ticks = buildTicks([0, 50, 100], scale, (value) => `${value}V`);
    expect(ticks).toEqual([
      { value: 0, offset: 0, label: '0V' },
      { value: 50, offset: 100, label: '50V' },
      { value: 100, offset: 200, label: '100V' },
    ]);
  });
});
