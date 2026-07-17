import { normalizedRectFrom, pointInRect, rectsIntersect } from './annotation-hit-testing';

const RECT = { x: 0.2, y: 0.2, w: 0.3, h: 0.2 };

describe('OMCT-C11-L2-03.03 Pixel-spatial annotation selection', () => {
  it('hit-tests a click point against an annotation rectangle, edges inclusive', () => {
    expect(pointInRect({ x: 0.3, y: 0.3 }, RECT)).toBe(true);
    expect(pointInRect({ x: 0.2, y: 0.2 }, RECT)).toBe(true);
    expect(pointInRect({ x: 0.51, y: 0.3 }, RECT)).toBe(false);
    expect(pointInRect({ x: 0.3, y: 0.45 }, RECT)).toBe(false);
  });

  it('intersects a marquee region with annotation rectangles', () => {
    expect(rectsIntersect(RECT, { x: 0.4, y: 0.3, w: 0.4, h: 0.4 })).toBe(true);
    expect(rectsIntersect(RECT, { x: 0.55, y: 0.45, w: 0.2, h: 0.2 })).toBe(false);
  });

  it('normalizes a marquee dragged from any corner', () => {
    const rect = normalizedRectFrom({ x: 0.6, y: 0.5 }, { x: 0.2, y: 0.1 });

    expect(rect.x).toBeCloseTo(0.2);
    expect(rect.y).toBeCloseTo(0.1);
    expect(rect.w).toBeCloseTo(0.4);
    expect(rect.h).toBeCloseTo(0.4);
  });
});
