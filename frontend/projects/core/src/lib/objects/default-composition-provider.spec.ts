import { TestBed } from '@angular/core/testing';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { DomainObject } from '../models/domain-object';
import { ObjectApi } from './object-api.service';
import { DefaultCompositionProvider } from './default-composition-provider';

function domainObject(key: string, composition: string[]): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'folder',
    location: null,
    composition,
  };
}

describe('OMCT-C02-L2-03.02 Model-backed composition', () => {
  let provider: DefaultCompositionProvider;
  let saved: DomainObject[];

  beforeEach(() => {
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
      providers: [
        DefaultCompositionProvider,
        { provide: ObjectsGateway, useClass: ObjectsGatewayStub },
      ],
    });
    provider = TestBed.inject(DefaultCompositionProvider);
    saved = [];
    jest.spyOn(TestBed.inject(ObjectApi), 'save').mockImplementation(async (object) => {
      saved.push(object);
      return { keyString: object.keyString, outcome: 'updated', object };
    });
  });

  it('loads the stored composition', async () => {
    expect(await provider.load(domainObject('p', ['a', 'b']))).toEqual(['a', 'b']);
  });

  it('persists the parent with the child appended on add', async () => {
    await provider.add(domainObject('p', ['a']), 'b');

    expect(saved[0].composition).toEqual(['a', 'b']);
  });

  it('does not duplicate an already-present child', async () => {
    await provider.add(domainObject('p', ['a']), 'a');

    expect(saved).toEqual([]);
  });

  it('persists the parent without the child on remove', async () => {
    await provider.remove(domainObject('p', ['a', 'b']), 'a');

    expect(saved[0].composition).toEqual(['b']);
  });

  it('persists the reordered composition', async () => {
    await provider.reorder(domainObject('p', ['a', 'b', 'c']), 0, 2);

    expect(saved[0].composition).toEqual(['b', 'c', 'a']);
  });
});
