import { reconcileLayoutItems, unresolvedReferences } from './layout-reconciler';
import { LayoutItem, newLayoutItem } from './layout-model';

function subobject(id: string, keyString: string): LayoutItem {
  return { ...newLayoutItem('subobject', 0), id, keyString };
}

describe('OMCT-C09-L2-01.02 Composition and item synchronization', () => {
  it('adds a default-geometry item for a composed child without one', () => {
    const result = reconcileLayoutItems({ items: [] }, ['pwr.bus_v']);

    expect(result.changed).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ kind: 'subobject', keyString: 'pwr.bus_v' });
  });

  it('removes the item for a child that left composition', () => {
    const result = reconcileLayoutItems(
      { items: [subobject('a', 'pwr.bus_v'), subobject('b', 'cam.cupola')] },
      ['pwr.bus_v'],
    );

    expect(result.changed).toBe(true);
    expect(result.items.map((item) => item.keyString)).toEqual(['pwr.bus_v']);
  });

  it('never touches drawing items', () => {
    const text = { ...newLayoutItem('text', 0), text: 'Station' };

    const result = reconcileLayoutItems({ items: [text] }, []);

    expect(result.changed).toBe(false);
    expect(result.items).toEqual([text]);
  });

  it('reports no change when items and composition already agree', () => {
    const items = [subobject('a', 'pwr.bus_v')];

    const result = reconcileLayoutItems({ items }, ['pwr.bus_v']);

    expect(result.changed).toBe(false);
    expect(result.items).toBe(items);
  });
});

describe('OMCT-C09-L2-01.05 Clipboard transfer — composition repairs', () => {
  it('lists pasted sub-object references missing from composition once each', () => {
    const items = [
      subobject('a', 'pwr.bus_v'),
      subobject('b', 'cam.cupola'),
      subobject('c', 'cam.cupola'),
    ];

    expect(unresolvedReferences(items, ['pwr.bus_v'])).toEqual(['cam.cupola']);
  });
});
