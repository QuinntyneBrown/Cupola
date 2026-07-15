import { TestBed } from '@angular/core/testing';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { ObjectApi } from './object-api.service';
import { Transaction } from './transaction';
import { TransactionManager } from './transaction-manager.service';

function domainObject(key: string): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'folder',
    location: null,
    composition: [],
  };
}

function result(object: DomainObject): ObjectSaveResult {
  return { keyString: object.keyString, outcome: 'updated', object };
}

describe('OMCT-C02-L2-02.07 Transaction commit and cancel', () => {
  it('saves every dirty object on commit and clears the transaction', async () => {
    const saved: DomainObject[][] = [];
    const transaction = new Transaction(async (objects) => {
      saved.push(objects);
      return objects.map(result);
    });
    transaction.add(domainObject('a'));
    transaction.add(domainObject('b'));

    const results = await transaction.commit();

    expect(saved[0].map((object) => object.keyString)).toEqual(['a', 'b']);
    expect(results.map((r) => r.keyString)).toEqual(['a', 'b']);
    expect(transaction.getDirty()).toEqual([]);
  });

  it('clears dirty objects without saving on cancel', () => {
    const saver = jest.fn(async () => []);
    const transaction = new Transaction(saver);
    transaction.add(domainObject('a'));

    transaction.cancel();

    expect(saver).not.toHaveBeenCalled();
    expect(transaction.getDirty()).toEqual([]);
  });

  it('routes an active transaction commit through the ObjectApi save path', async () => {
    class ObjectsGatewayStub extends ObjectsGateway {
      getObject = jest.fn();
      getComposition = jest.fn();
      getAnnotations = jest.fn();
      updateObject = jest.fn();
      saveObject = jest.fn();
      getObjects = jest.fn();
      saveObjects = jest.fn();
    }
    TestBed.configureTestingModule({
      providers: [TransactionManager, { provide: ObjectsGateway, useClass: ObjectsGatewayStub }],
    });
    const manager = TestBed.inject(TransactionManager);
    const api = TestBed.inject(ObjectApi);
    const saveSpy = jest.spyOn(api, 'save').mockImplementation(async (object) => result(object));

    const transaction = manager.start();
    transaction.add(domainObject('a'));
    transaction.add(domainObject('b'));
    await manager.commit();

    expect(saveSpy.mock.calls.map((call) => call[0].keyString)).toEqual(['a', 'b']);
    expect(manager.isActive()).toBe(false);
  });
});
