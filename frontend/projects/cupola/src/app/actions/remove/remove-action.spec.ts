import { DomainObject, ObjectUpdatesService, TransactionManager } from '@cupola/core';

import { RemoveAction } from './remove-action';

function object(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: key, type: 'folder', location: 'mine', composition: [], ...over };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('OMCT-C03-L2-02.05 Composition removal', () => {
  it('removes the child from the parent within a transaction and closes it', async () => {
    const parent = object('parent', { composition: ['src'] });
    const transaction = { add: jest.fn() };
    const manager = {
      start: jest.fn(() => transaction),
      commit: jest.fn(async () => [{ keyString: 'parent', outcome: 'updated', object: { ...parent, composition: [] } }]),
      cancel: jest.fn(),
    } as unknown as TransactionManager;
    const updates = { emitLocal: jest.fn() } as unknown as ObjectUpdatesService;

    const action = new RemoveAction(manager, updates);
    action.invoke({ objectPath: [parent, object('src')] });
    await flush();

    expect(transaction.add).toHaveBeenCalledWith(expect.objectContaining({ keyString: 'parent', composition: [] }));
    expect(manager.commit).toHaveBeenCalled();
    expect(updates.emitLocal).toHaveBeenCalled();
  });
});

describe('OMCT-C03-L2-02.06 Locked-object action policy', () => {
  it('does not apply to a locked original but applies to a normal child', () => {
    const action = new RemoveAction({} as TransactionManager, {} as ObjectUpdatesService);
    const parent = object('parent');
    const locked = object('root', { location: 'ROOT' });
    const normal = object('child', { location: 'parent' });

    expect(action.appliesTo({ objectPath: [parent, locked] })).toBe(false);
    expect(action.appliesTo({ objectPath: [parent, normal] })).toBe(true);
  });
});
