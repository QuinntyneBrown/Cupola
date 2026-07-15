import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { Annotation } from '../models/annotation';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { CompositionApi } from './composition-api.service';
import { CompositionProvider } from './composition-provider';

function domainObject(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'folder',
    location: null,
    composition: [],
    ...over,
  };
}

class EchoObjectsGateway extends ObjectsGateway {
  override getObject(keyString: string): Observable<DomainObject> {
    return of(domainObject(keyString));
  }
  override getComposition(): Observable<DomainObject[]> {
    return of([]);
  }
  override getAnnotations(): Observable<Annotation[]> {
    return of([]);
  }
  override updateObject(): Observable<DomainObject> {
    return of(domainObject('x'));
  }
  override saveObject(): Observable<ObjectSaveResult> {
    return of({ keyString: 'x', outcome: 'updated', object: null });
  }
  override getObjects(): Observable<DomainObject[]> {
    return of([]);
  }
  override saveObjects(): Observable<ObjectSaveResult[]> {
    return of([]);
  }
}

function api(): CompositionApi {
  TestBed.configureTestingModule({
    providers: [CompositionApi, { provide: ObjectsGateway, useClass: EchoObjectsGateway }],
  });
  return TestBed.inject(CompositionApi);
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('OMCT-C02-L2-03.01 Composition availability', () => {
  it('returns a falsy result when no provider supports the object', () => {
    const composition = api();
    composition.addProvider({
      appliesTo: (object) => object.type === 'container',
      load: async () => [],
    });

    expect(composition.get(domainObject('leaf', { type: 'telemetry' }))).toBeUndefined();
  });
});

describe('OMCT-C02-L2-03.03 Custom composition providers', () => {
  it('loads provider children and relays provider membership changes', async () => {
    const composition = api();
    let emit: ((children: string[]) => void) | undefined;
    const provider: CompositionProvider = {
      appliesTo: (object) => object.type === 'dynamic',
      load: async () => ['child-1'],
      observe: (_object, listener) => {
        emit = listener;
        return () => {};
      },
    };
    composition.addProvider(provider);

    const collection = composition.get(domainObject('parent', { type: 'dynamic' }));
    const children = await collection!.load();
    expect(children.map((child) => child.keyString)).toEqual(['child-1']);

    const relayed: string[][] = [];
    collection!.changes.subscribe((next) => relayed.push(next.map((child) => child.keyString)));
    emit!(['child-1', 'child-2']);
    await flush();

    expect(relayed).toEqual([['child-1', 'child-2']]);
  });
});

describe('OMCT-C02-L2-03.04 Composition policies', () => {
  it('allows a relationship only when every applicable policy allows it', () => {
    const composition = api();
    const parent = domainObject('parent');
    composition.addPolicy({ allow: () => true });

    expect(composition.checkPolicy(parent, domainObject('c', { type: 'folder' }))).toBe(true);

    composition.addPolicy({ allow: (_parent, child) => child.type !== 'telemetry' });

    expect(composition.checkPolicy(parent, domainObject('c', { type: 'telemetry' }))).toBe(false);
    expect(composition.checkPolicy(parent, domainObject('c', { type: 'folder' }))).toBe(true);
  });
});
