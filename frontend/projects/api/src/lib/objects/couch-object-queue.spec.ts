import { firstValueFrom, of } from 'rxjs';

import { DomainObject, ObjectSaveResult } from '@cupola/core';

import { CouchObjectQueue, CouchObjectTransport } from './couch-object-queue';

describe('CouchObjectQueue', () => {
  const first: DomainObject = {
    identifier: { namespace: '', key: 'first' },
    keyString: 'first',
    name: 'First',
    type: 'folder',
    location: null,
    composition: [],
  };
  const second: DomainObject = {
    ...first,
    identifier: { namespace: '', key: 'second' },
    keyString: 'second',
    name: 'Second',
  };
  let transport: jest.Mocked<CouchObjectTransport>;

  beforeEach(() => {
    jest.useFakeTimers();
    transport = {
      getObject: jest.fn((key) => of(key === 'first' ? first : second)),
      getObjects: jest.fn(() => of([first, second])),
      saveObject: jest.fn((object) => of(result(object, 'updated'))),
      saveObjects: jest.fn((objects) =>
        of(objects.map((object, index) => result(object, index ? 'conflict' : 'updated'))),
      ),
    };
  });

  afterEach(() => jest.useRealTimers());

  it('leaves one retrieval unbatched (OMCT-C04-L2-02.02)', async () => {
    const queue = new CouchObjectQueue(transport);
    const pending = firstValueFrom(queue.get('first'));
    jest.runOnlyPendingTimers();

    await expect(pending).resolves.toEqual(first);
    expect(transport.getObject).toHaveBeenCalledWith('first');
    expect(transport.getObjects).not.toHaveBeenCalled();
  });

  it('batches simultaneous retrievals and resolves each requested object (OMCT-C04-L2-02.02)', async () => {
    const queue = new CouchObjectQueue(transport);
    const pendingFirst = firstValueFrom(queue.get('first'));
    const pendingSecond = firstValueFrom(queue.get('second'));
    jest.runOnlyPendingTimers();

    await expect(Promise.all([pendingFirst, pendingSecond])).resolves.toEqual([first, second]);
    expect(transport.getObjects).toHaveBeenCalledWith(['first', 'second']);
    expect(transport.getObject).not.toHaveBeenCalled();
  });

  it('reports each batched save outcome independently (OMCT-C04-L2-02.03)', async () => {
    const queue = new CouchObjectQueue(transport);
    const savedFirst = firstValueFrom(queue.save(first));
    const savedSecond = firstValueFrom(queue.save(second));
    jest.runOnlyPendingTimers();

    const results = await Promise.all([savedFirst, savedSecond]);
    expect(results.map((item) => item.outcome)).toEqual(['updated', 'conflict']);
    expect(transport.saveObjects).toHaveBeenCalledWith([first, second]);
  });

  it('uses the direct transport when shared workers are unavailable (OMCT-C04-L2-02.04)', async () => {
    const original = (globalThis as { SharedWorker?: unknown }).SharedWorker;
    delete (globalThis as { SharedWorker?: unknown }).SharedWorker;
    const queue = new CouchObjectQueue(transport);
    const pending = firstValueFrom(queue.get('first'));
    jest.runOnlyPendingTimers();

    await expect(pending).resolves.toEqual(first);
    expect(transport.getObject).toHaveBeenCalled();
    (globalThis as { SharedWorker?: unknown }).SharedWorker = original;
  });
});

function result(object: DomainObject, outcome: ObjectSaveResult['outcome']): ObjectSaveResult {
  return { keyString: object.keyString, outcome, object };
}
