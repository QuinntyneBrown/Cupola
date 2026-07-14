import { Action, ActionContext } from './action';
import { ActionRegistry } from './action-registry.service';
import { DomainObject } from '../models/domain-object';

function object(type: string): DomainObject {
  return {
    identifier: { namespace: '', key: 'k' },
    keyString: 'k',
    name: 'K',
    type,
    location: null,
    composition: [],
  };
}

function action(key: string, appliesTo?: (context: ActionContext) => boolean): Action {
  return { key, name: key, appliesTo, invoke: () => {} };
}

describe('OMCT-C15-L2-03.01 ActionRegistry', () => {
  it('returns a collection of the actions applicable to the object path', () => {
    const registry = new ActionRegistry();
    registry.register(action('always'));
    registry.register(action('folders-only', (ctx) => ctx.objectPath.at(-1)?.type === 'folder'));

    const forFolder = registry.getActionCollection({ objectPath: [object('folder')] });
    const forTelemetry = registry.getActionCollection({ objectPath: [object('telemetry')] });

    expect(forFolder.getActions().map((a) => a.key).sort()).toEqual(['always', 'folders-only']);
    expect(forTelemetry.getActions().map((a) => a.key)).toEqual(['always']);
  });
});
