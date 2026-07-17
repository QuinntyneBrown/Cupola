import { signal } from '@angular/core';
import { DomainObject } from '@cupola/core';

import { LayoutClipboardService } from '../layout-clipboard.service';
import { LayoutEditService, LayoutEditSession } from '../layout-edit.service';
import { CopyToClipboardAction } from './copy-to-clipboard-action';

function layout(): DomainObject {
  return {
    identifier: { namespace: '', key: 'dl.station' },
    keyString: 'dl.station',
    name: 'Station layout',
    type: 'layout',
    location: null,
    composition: [],
  };
}

function session(selected: string[]): LayoutEditSession & { copy: jest.Mock } {
  return {
    selectedItemIds: signal(selected).asReadonly(),
    copy: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn(),
  };
}

describe('OMCT-C09-L2-01.05 Clipboard transfer — copy action', () => {
  it('applies only while editing a layout with selected items', () => {
    const edits = new LayoutEditService();
    const action = new CopyToClipboardAction(edits, new LayoutClipboardService());
    const context = { objectPath: [layout()] };

    expect(action.appliesTo(context)).toBe(false);

    edits.register('dl.station', session(['item-1']));
    edits.beginEdit('dl.station');
    expect(action.appliesTo(context)).toBe(true);

    edits.register('dl.station', session([]));
    expect(action.appliesTo(context)).toBe(false);
  });

  it('delegates the copy to the layout edit session', () => {
    const edits = new LayoutEditService();
    const editSession = session(['item-1']);
    edits.register('dl.station', editSession);
    edits.beginEdit('dl.station');
    const action = new CopyToClipboardAction(edits, new LayoutClipboardService());

    action.invoke({ objectPath: [layout()] });

    expect(editSession.copy).toHaveBeenCalled();
  });
});
