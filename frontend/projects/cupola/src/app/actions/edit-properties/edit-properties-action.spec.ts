import { DomainObject, ObjectSaveResult, ObjectUpdatesService, TransactionManager } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { EditPropertiesAction } from './edit-properties-action';

function object(): DomainObject {
  return { identifier: { namespace: '', key: 'o' }, keyString: 'o', name: 'Original', type: 'folder', location: 'mine', composition: [] };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function harness(showForm: () => Promise<Record<string, unknown>>, commit: () => Promise<ObjectSaveResult[]>) {
  const forms = { showForm: jest.fn(showForm) } as unknown as FormsService;
  const transaction = { add: jest.fn() };
  const manager = {
    start: jest.fn(() => transaction),
    commit: jest.fn(commit),
    cancel: jest.fn(),
  } as unknown as TransactionManager;
  const updates = { emitLocal: jest.fn() } as unknown as ObjectUpdatesService;
  return { forms, transaction, manager, updates, action: new EditPropertiesAction(forms, manager, updates) };
}

describe('OMCT-C03-L2-01.02 Edit applicability', () => {
  it('applies only to persistable, non-missing objects', () => {
    const { action } = harness(
      async () => ({}),
      async () => [],
    );
    expect(action.appliesTo({ objectPath: [object()] })).toBe(true);
    expect(action.appliesTo({ objectPath: [{ ...object(), type: 'unknown' }] })).toBe(false);
  });
});

describe('OMCT-C03-L2-01.03 Save edited properties', () => {
  it('commits the changed object and publishes the update', async () => {
    const edited = { ...object(), name: 'Renamed' };
    const { action, transaction, manager, updates } = harness(
      async () => ({ name: 'Renamed' }),
      async () => [{ keyString: 'o', outcome: 'updated', object: edited }],
    );

    action.invoke({ objectPath: [object()] });
    await flush();

    expect(transaction.add).toHaveBeenCalledWith(expect.objectContaining({ name: 'Renamed' }));
    expect(manager.commit).toHaveBeenCalled();
    expect(updates.emitLocal).toHaveBeenCalledWith(edited);
  });
});

describe('OMCT-C03-L2-01.04 Discard edited properties', () => {
  it('cancels the transaction when the form is cancelled', async () => {
    const { action, manager } = harness(
      () => Promise.reject(new Error('cancelled')),
      async () => [],
    );

    action.invoke({ objectPath: [object()] });
    await flush();

    expect(manager.cancel).toHaveBeenCalled();
    expect(manager.commit).not.toHaveBeenCalled();
  });
});

describe('OMCT-C03-L2-01.05 Failed-save retention', () => {
  it('keeps the transaction (does not cancel) when the save fails', async () => {
    const { action, manager } = harness(
      async () => ({ name: 'Renamed' }),
      () => Promise.reject(new Error('save failed')),
    );

    expect(() => action.invoke({ objectPath: [object()] })).not.toThrow();
    await flush();

    expect(manager.commit).toHaveBeenCalled();
    expect(manager.cancel).not.toHaveBeenCalled();
  });
});
