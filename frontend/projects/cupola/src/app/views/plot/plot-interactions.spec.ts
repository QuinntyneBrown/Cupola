import { panBounds, requiresReload, zoomBounds } from './plot-interactions';

describe('panBounds', () => {
  it('shifts the window forward by a fraction of its span (02.05)', () => {
    expect(panBounds({ start: 0, end: 100 }, 0.25)).toEqual({ start: 25, end: 125 });
  });

  it('shifts backward for a negative fraction', () => {
    expect(panBounds({ start: 100, end: 200 }, -0.5)).toEqual({ start: 50, end: 150 });
  });
});

describe('zoomBounds', () => {
  it('narrows the span about the centre when zooming in (02.05)', () => {
    expect(zoomBounds({ start: 0, end: 100 }, 0.5)).toEqual({ start: 25, end: 75 });
  });

  it('widens the span when zooming out', () => {
    expect(zoomBounds({ start: 25, end: 75 }, 2)).toEqual({ start: 0, end: 100 });
  });

  it('keeps a focal point fixed', () => {
    const zoomed = zoomBounds({ start: 0, end: 100 }, 0.5, 0);
    expect(zoomed.start).toBe(0);
    expect(zoomed.end).toBe(50);
  });
});

describe('requiresReload', () => {
  it('detects panning outside the loaded window', () => {
    expect(requiresReload({ start: 0, end: 100 }, { start: 50, end: 150 })).toBe(true);
    expect(requiresReload({ start: 0, end: 100 }, { start: 10, end: 90 })).toBe(false);
  });
});
