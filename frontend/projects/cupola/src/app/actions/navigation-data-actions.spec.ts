import { Router } from '@angular/router';
import { DomainObject, ObjectApi, ObjectUpdatesService } from '@cupola/core';

import { ClearDataAction } from './clear-data/clear-data-action';
import { ClearDataService } from './clear-data/clear-data.service';
import { GoToOriginalAction } from './go-to-original/go-to-original-action';
import { OpenInNewTabAction } from './open-in-new-tab/open-in-new-tab-action';
import { ReloadAction } from './reload/reload-action';

function object(key: string): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: key, type: 'folder', location: 'mine', composition: [] };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('OMCT-C03-L2-04.01 Original-location navigation', () => {
  it('navigates to the original path, root-first', async () => {
    const objects = {
      getOriginalPath: jest.fn(async () => [object('child'), object('parent')]),
    } as unknown as ObjectApi;
    const navigate = jest.fn();
    const action = new GoToOriginalAction(objects, { navigate } as unknown as Router);

    action.invoke({ objectPath: [object('child')] });
    await flush();

    expect(navigate).toHaveBeenCalledWith(['/browse', 'parent', 'child']);
  });
});

describe('OMCT-C03-L2-04.02 New-tab navigation', () => {
  it('opens the object route in a new tab', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    const action = new OpenInNewTabAction();

    action.invoke({ objectPath: [object('a'), object('b')] });

    expect(open).toHaveBeenCalledWith('#/browse/a/b', '_blank', 'noopener');
    open.mockRestore();
  });
});

describe('OMCT-C03-L2-04.03 Object reload', () => {
  it('requests fresh provider state and publishes it', async () => {
    const fresh = object('o');
    const objects = { get: jest.fn(async () => fresh) } as unknown as ObjectApi;
    const updates = { emitLocal: jest.fn() } as unknown as ObjectUpdatesService;
    const action = new ReloadAction(objects, updates);

    action.invoke({ objectPath: [object('o')] });
    await flush();

    expect(objects.get).toHaveBeenCalledWith('o');
    expect(updates.emitLocal).toHaveBeenCalledWith(fresh);
  });
});

describe('OMCT-C03-L2-04.04 Global clear-data event', () => {
  it('emits the global clear-data event when invoked', () => {
    const service = new ClearDataService();
    const events: number[] = [];
    service.cleared.subscribe(() => events.push(1));

    new ClearDataAction(service).invoke();

    expect(events).toEqual([1]);
  });
});
