import { createTimeScale } from './time-scale';

describe('OMCT-C12-L2-01.02 Activity swimlanes', () => {
  const scale = createTimeScale({ start: 1000, end: 2000 });

  it('maps a time to its percentage offset within the bounds', () => {
    expect(scale.offset(1000)).toBe(0);
    expect(scale.offset(1500)).toBe(50);
    expect(scale.offset(2000)).toBe(100);
  });

  it('positions an activity by its start and end within the bounds', () => {
    expect(scale.offset(1250)).toBe(25);
    expect(scale.width(1250, 1750)).toBe(50);
  });

  it('clamps offsets and widths for activities extending past the bounds', () => {
    expect(scale.clampedOffset(500)).toBe(0);
    expect(scale.clampedOffset(2500)).toBe(100);
    expect(scale.width(500, 2500)).toBe(100);
  });

  it('reports whether a time falls within the bounds', () => {
    expect(scale.contains(1500)).toBe(true);
    expect(scale.contains(999)).toBe(false);
    expect(scale.contains(2001)).toBe(false);
  });

  it('collapses to zero offset for degenerate bounds', () => {
    const flat = createTimeScale({ start: 5, end: 5 });
    expect(flat.offset(5)).toBe(0);
    expect(flat.width(5, 5)).toBe(0);
  });
});
