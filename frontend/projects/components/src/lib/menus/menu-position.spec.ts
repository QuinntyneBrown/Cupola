import { calculateMenuPosition } from './menu-position';

describe('OMCT-C15-L2-03.04 calculateMenuPosition', () => {
  const anchor = { x: 100, y: 200, width: 80, height: 32 };
  const menu = { width: 160, height: 120 };
  const viewport = { width: 1024, height: 768 };

  it('positions a bottom-start menu below the anchor left edge', () => {
    expect(calculateMenuPosition(anchor, menu, 'bottom-start', viewport)).toEqual({ x: 100, y: 232 });
  });

  it('positions a bottom-end menu aligned to the anchor right edge', () => {
    expect(calculateMenuPosition(anchor, menu, 'bottom-end', viewport)).toEqual({ x: 20, y: 232 });
  });

  it('positions a top-start menu above the anchor', () => {
    expect(calculateMenuPosition(anchor, menu, 'top-start', viewport)).toEqual({ x: 100, y: 80 });
  });

  it('clamps the menu within the viewport', () => {
    const nearEdge = { x: 1000, y: 700, width: 40, height: 20 };
    const result = calculateMenuPosition(nearEdge, menu, 'bottom-start', viewport);
    expect(result.x).toBe(viewport.width - menu.width);
    expect(result.y).toBe(viewport.height - menu.height);
  });
});
