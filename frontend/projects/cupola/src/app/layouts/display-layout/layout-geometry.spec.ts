import {
  alignItems,
  distributeItems,
  moveItems,
  reorderStack,
  resizeItem,
  rotateItems,
  snapToGrid,
} from './layout-geometry';
import { LayoutItem, newLayoutItem } from './layout-model';

function item(id: string, over: Partial<LayoutItem> = {}): LayoutItem {
  return { id, kind: 'box', x: 2, y: 2, w: 4, h: 4, rotation: 0, z: 0, ...over };
}

describe('OMCT-C09-L2-01.03 Item geometry', () => {
  it('snaps fractional coordinates onto the grid', () => {
    expect(snapToGrid(2.4)).toBe(2);
    expect(snapToGrid(2.5)).toBe(3);
  });

  it('moves selected items by grid deltas, clamped to the canvas origin', () => {
    const moved = moveItems([item('a'), item('b', { x: 10 })], ['a'], -5, 3);

    expect(moved[0]).toMatchObject({ x: 0, y: 5 });
    expect(moved[1]).toMatchObject({ x: 10, y: 2 });
  });

  it('moves both endpoints of a line item together', () => {
    const line = item('l', { kind: 'line', x: 2, y: 2, x2: 8, y2: 4 });

    const moved = moveItems([line], ['l'], 3, 1);

    expect(moved[0]).toMatchObject({ x: 5, y: 3, x2: 11, y2: 5 });
  });

  it('resizes from a corner handle keeping the opposite corner anchored', () => {
    const resized = resizeItem([item('a', { x: 4, y: 4, w: 6, h: 6 })], 'a', 'nw', 2, 1);

    expect(resized[0]).toMatchObject({ x: 6, y: 5, w: 4, h: 5 });
  });

  it('enforces the minimum size when shrinking through zero', () => {
    const resized = resizeItem([item('a', { w: 2, h: 2 })], 'a', 'se', -10, -10);

    expect(resized[0]).toMatchObject({ w: 1, h: 1 });
  });

  it('normalizes rotation into [0, 360) and never rotates lines', () => {
    const rotated = rotateItems(
      [item('a'), item('l', { kind: 'line', x2: 6, y2: 2 })],
      ['a', 'l'],
      -90,
    );

    expect(rotated[0].rotation).toBe(270);
    expect(rotated[1].rotation).toBe(0);
  });

  it('aligns selected items to the selection extreme edge', () => {
    const aligned = alignItems(
      [item('a', { x: 2 }), item('b', { x: 8 }), item('c', { x: 20 })],
      ['a', 'b'],
      'left',
    );

    expect(aligned[0].x).toBe(2);
    expect(aligned[1].x).toBe(2);
    expect(aligned[2].x).toBe(20);
  });

  it('aligns to the right edge from the widest extent', () => {
    const aligned = alignItems([item('a', { x: 2, w: 4 }), item('b', { x: 10, w: 2 })], ['a', 'b'], 'right');

    expect(aligned[0].x).toBe(8);
    expect(aligned[1].x).toBe(10);
  });

  it('distributes three or more items evenly between the extremes', () => {
    const distributed = distributeItems(
      [item('a', { x: 0 }), item('b', { x: 1 }), item('c', { x: 10 })],
      ['a', 'b', 'c'],
      'horizontal',
    );

    expect(distributed.map((entry) => entry.x)).toEqual([0, 5, 10]);
  });

  it('reorders stacking one step and renumbers z densely', () => {
    const items = [item('a', { z: 0 }), item('b', { z: 1 }), item('c', { z: 2 })];

    const forward = reorderStack(items, ['a'], 'forward');
    const zOf = (id: string) => forward.find((entry) => entry.id === id)!.z;

    expect(zOf('a')).toBe(1);
    expect(zOf('b')).toBe(0);
    expect(zOf('c')).toBe(2);
  });

  it('creates items with cascading default geometry', () => {
    const first = newLayoutItem('box', 0);
    const second = newLayoutItem('box', 1);

    expect(second.x).toBeGreaterThan(first.x);
    expect(second.y).toBeGreaterThan(first.y);
    expect(first.id).not.toBe(second.id);
  });
});
