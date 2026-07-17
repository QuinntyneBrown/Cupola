import { signal } from '@angular/core';

import { LayoutEditService, LayoutEditSession } from './layout-edit.service';

function fakeSession(): LayoutEditSession {
  return {
    selectedItemIds: signal<string[]>([]).asReadonly(),
    save: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn(),
  };
}

describe('OMCT-C09-L2-01.03 Item geometry — edit sessions', () => {
  it('tracks which layout is being edited', () => {
    const service = new LayoutEditService();
    service.register('dl.station', fakeSession());

    expect(service.isEditing('dl.station')).toBe(false);
    service.beginEdit('dl.station');
    expect(service.isEditing('dl.station')).toBe(true);
    expect(service.editingKey()).toBe('dl.station');

    service.endEdit('dl.station');
    expect(service.editingKey()).toBeNull();
  });

  it('exposes the registered session to toolbars and clears state on real departure', async () => {
    const service = new LayoutEditService();
    const session = fakeSession();
    service.register('dl.station', session);
    service.beginEdit('dl.station');

    expect(service.session('dl.station')).toBe(session);

    service.unregister('dl.station');
    expect(service.session('dl.station')).toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.editingKey()).toBeNull();
  });

  it('keeps the edit open across a view recreation that immediately re-registers', async () => {
    const service = new LayoutEditService();
    service.register('dl.station', fakeSession());
    service.beginEdit('dl.station');

    // A mid-edit save refreshes the browse path: the view is destroyed and a
    // new instance re-registers within the same task.
    service.unregister('dl.station');
    service.register('dl.station', fakeSession());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.editingKey()).toBe('dl.station');
  });

  it('only clears the editing key for the layout that ends its own edit', () => {
    const service = new LayoutEditService();
    service.register('a', fakeSession());
    service.register('b', fakeSession());
    service.beginEdit('b');

    service.endEdit('a');

    expect(service.editingKey()).toBe('b');
  });
});
