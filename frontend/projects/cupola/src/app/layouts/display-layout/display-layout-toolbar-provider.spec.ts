import { signal } from '@angular/core';
import { DomainObject, SelectedItem } from '@cupola/core';

import { LayoutClipboardService } from '../layout-clipboard.service';
import { LayoutEditService, LayoutEditSession } from '../layout-edit.service';
import { newLayoutItem } from './layout-model';
import { DisplayLayoutToolbarProvider } from './display-layout-toolbar-provider';

function layoutObject(): DomainObject {
  return {
    identifier: { namespace: '', key: 'dl.station' },
    keyString: 'dl.station',
    name: 'Station layout',
    type: 'layout',
    location: null,
    composition: [],
  };
}

function selection(type: string, object = layoutObject()): SelectedItem[] {
  return [
    { element: document.createElement('div'), context: { key: object.keyString, object, type } },
  ];
}

function session(selectedIds: string[]): LayoutEditSession & { save: jest.Mock } {
  return {
    selectedItemIds: signal(selectedIds).asReadonly(),
    align: jest.fn(),
    distribute: jest.fn(),
    reorderStack: jest.fn(),
    copy: jest.fn(),
    paste: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn(),
  };
}

function setup(selectedIds: string[] = []) {
  const edits = new LayoutEditService();
  const clipboard = new LayoutClipboardService();
  const provider = new DisplayLayoutToolbarProvider(edits, clipboard);
  const editSession = session(selectedIds);
  edits.register('dl.station', editSession);
  return { edits, clipboard, provider, session: editSession };
}

describe('OMCT-C09-L2-01.03 Item geometry — edit toolbar', () => {
  it('applies to layout object and layout-item selections only', () => {
    const { provider } = setup();

    expect(provider.forSelection(selection('object'))).toBe(true);
    expect(provider.forSelection(selection('layout-item'))).toBe(true);
    expect(
      provider.forSelection(selection('object', { ...layoutObject(), type: 'folder' })),
    ).toBe(false);
  });

  it('offers only the Edit control in browse mode', () => {
    const { provider } = setup();

    const controls = provider.toolbar(selection('object'));

    expect(controls.map((control) => control.key)).toEqual(['layout.edit']);
  });

  it('offers geometry, clipboard, and commit controls while editing a multi-selection', () => {
    const { provider, edits, clipboard, session: editSession } = setup(['a', 'b', 'c']);
    edits.beginEdit('dl.station');
    clipboard.store([newLayoutItem('box', 0)]);

    const keys = provider.toolbar(selection('layout-item')).map((control) => control.key);

    expect(keys).toEqual([
      'layout.align-left',
      'layout.align-right',
      'layout.align-top',
      'layout.align-bottom',
      'layout.distribute-h',
      'layout.distribute-v',
      'layout.forward',
      'layout.backward',
      'layout.copy',
      'layout.paste',
      'layout.save',
      'layout.cancel',
    ]);

    provider
      .toolbar(selection('layout-item'))
      .find((control) => control.key === 'layout.align-left')!
      .onActivate();
    expect(editSession.align).toHaveBeenCalledWith('left');
  });

  it('routes save and cancel to the session', () => {
    const { provider, edits, session: editSession } = setup([]);
    edits.beginEdit('dl.station');

    const controls = provider.toolbar(selection('object'));
    controls.find((control) => control.key === 'layout.save')!.onActivate();
    controls.find((control) => control.key === 'layout.cancel')!.onActivate();

    expect(editSession.save).toHaveBeenCalled();
    expect(editSession.cancel).toHaveBeenCalled();
  });
});
