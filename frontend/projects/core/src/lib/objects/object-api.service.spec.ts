import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, of } from 'rxjs';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { Annotation } from '../models/annotation';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { User } from '../models/user';
import { UserService } from '../user/user.service';
import { InterceptorRegistry } from './interceptor-registry';
import { isMissingObject, MissingObjectInterceptor } from './missing-object-interceptor';
import { ObjectApi } from './object-api.service';
import { ObjectProvider } from './object-provider';

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

class ObjectsGatewayStub extends ObjectsGateway {
  static readonly DEFAULT = domainObject('default');
  override getObject(): Observable<DomainObject> {
    return of(ObjectsGatewayStub.DEFAULT);
  }
  override getComposition(): Observable<DomainObject[]> {
    return of([]);
  }
  override getAnnotations(): Observable<Annotation[]> {
    return of([]);
  }
  override updateObject(): Observable<DomainObject> {
    return of(ObjectsGatewayStub.DEFAULT);
  }
  override saveObject(): Observable<ObjectSaveResult> {
    return of({ keyString: 'default', outcome: 'updated', object: ObjectsGatewayStub.DEFAULT });
  }
  override getObjects(): Observable<DomainObject[]> {
    return EMPTY;
  }
  override saveObjects(): Observable<ObjectSaveResult[]> {
    return of([]);
  }
}

class FakeUserService extends UserService {
  constructor(private readonly user: User | null) {
    super();
  }
  override hasProvider(): boolean {
    return this.user !== null;
  }
  override currentUser(): Observable<User | null> {
    return of(this.user);
  }
  override activeRole(): Observable<string | null> {
    return of(null);
  }
}

class FakeProvider implements ObjectProvider {
  get = jest.fn(async (_keyString: string): Promise<DomainObject | undefined> => undefined);
  create = jest.fn(
    async (object: DomainObject): Promise<ObjectSaveResult> => ({
      keyString: object.keyString,
      outcome: 'created',
      object,
    }),
  );
  update = jest.fn(
    async (object: DomainObject): Promise<ObjectSaveResult> => ({
      keyString: object.keyString,
      outcome: 'updated',
      object,
    }),
  );
}

function setup(user?: User | null): ObjectApi {
  const providers: unknown[] = [ObjectApi, { provide: ObjectsGateway, useClass: ObjectsGatewayStub }];
  if (user !== undefined) {
    providers.push({ provide: UserService, useValue: new FakeUserService(user) });
  }
  TestBed.configureTestingModule({ providers: providers as never });
  return TestBed.inject(ObjectApi);
}

describe('OMCT-C02-L2-01.03 Provider routing', () => {
  it('routes get to the provider registered for the identifier namespace', async () => {
    const api = setup();
    const provider = new FakeProvider();
    const routed = domainObject('ns:1', { identifier: { namespace: 'ns', key: '1' } });
    provider.get.mockResolvedValue(routed);
    api.registerProvider('ns', provider);

    const result = await api.get('ns:1');

    expect(provider.get).toHaveBeenCalledWith('ns:1');
    expect(result).toBe(routed);
  });

  it('routes create and update to the namespace provider operations', async () => {
    const api = setup();
    const provider = new FakeProvider();
    api.registerProvider('ns', provider);

    await api.save(domainObject('ns:new', { identifier: { namespace: 'ns', key: 'new' } }));
    await api.save(
      domainObject('ns:old', { identifier: { namespace: 'ns', key: 'old' }, persisted: 'x' }),
    );

    expect(provider.create).toHaveBeenCalledTimes(1);
    expect(provider.update).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default gateway provider for an unregistered namespace', async () => {
    const api = setup();

    const result = await api.get('unregistered');

    expect(result).toBe(ObjectsGatewayStub.DEFAULT);
  });
});

describe('OMCT-C02-L2-01.04 Concurrent-get coalescing', () => {
  it('shares the in-flight provider request for the same identifier', async () => {
    const api = setup();
    const provider = new FakeProvider();
    let resolve!: (object: DomainObject) => void;
    provider.get.mockReturnValue(new Promise((r) => (resolve = r)));
    api.registerProvider('', provider);

    const first = api.get('k');
    const second = api.get('k');

    expect(provider.get).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);

    resolve(domainObject('k'));
    await first;

    await api.get('k');
    expect(provider.get).toHaveBeenCalledTimes(2);
  });
});

describe('OMCT-C02-L2-01.05 Retrieval interception', () => {
  it('resolves to the intercepted object', async () => {
    const api = setup();
    const provider = new FakeProvider();
    provider.get.mockResolvedValue(domainObject('k'));
    api.registerProvider('', provider);
    TestBed.inject(InterceptorRegistry).register({
      appliesTo: () => true,
      invoke: (_identifier, object) => ({ ...(object as DomainObject), name: 'intercepted' }),
    });

    const result = await api.get('k');

    expect(result.name).toBe('intercepted');
  });
});

describe('OMCT-C02-L2-01.06 Missing-object representation', () => {
  it('returns a missing-object placeholder when the provider supplies nothing', async () => {
    const api = setup();
    const provider = new FakeProvider();
    provider.get.mockResolvedValue(undefined);
    api.registerProvider('', provider);
    TestBed.inject(InterceptorRegistry).register(new MissingObjectInterceptor());

    const result = await api.get('gone');

    expect(isMissingObject(result)).toBe(true);
    expect(result.keyString).toBe('gone');
  });
});

describe('OMCT-C02-L2-02.01 Create and update selection', () => {
  it('calls create when the object has no persisted timestamp, update otherwise', async () => {
    const api = setup();
    const provider = new FakeProvider();
    api.registerProvider('', provider);

    await api.save(domainObject('fresh'));
    expect(provider.create).toHaveBeenCalledTimes(1);
    expect(provider.update).not.toHaveBeenCalled();

    await api.save(domainObject('existing', { persisted: '2020-01-01T00:00:00.000Z', version: 3 }));
    expect(provider.update).toHaveBeenCalledTimes(1);
  });
});

describe('OMCT-C02-L2-02.02 Persistence timestamps', () => {
  it('stamps created, modified, and persisted with persisted not before modified', async () => {
    const api = setup();
    const provider = new FakeProvider();
    api.registerProvider('', provider);

    await api.save(domainObject('fresh'));

    const stamped = provider.create.mock.calls[0][0];
    expect(stamped.created).toBeDefined();
    expect(stamped.modified).toBeDefined();
    expect(stamped.persisted).toBeDefined();
    expect(Date.parse(stamped.persisted as string)).toBeGreaterThanOrEqual(
      Date.parse(stamped.modified as string),
    );
  });
});

describe('OMCT-C02-L2-02.03 User provenance', () => {
  it('populates createdBy on create and modifiedBy on update from the active user', async () => {
    const api = setup({ id: 'operator', name: 'Operator' });
    const provider = new FakeProvider();
    api.registerProvider('', provider);

    await api.save(domainObject('fresh'));
    expect(provider.create.mock.calls[0][0].createdBy).toBe('operator');

    await api.save(domainObject('existing', { persisted: '2020-01-01T00:00:00.000Z' }));
    expect(provider.update.mock.calls[0][0].modifiedBy).toBe('operator');
  });
});

describe('OMCT-C02-L2-02.04 Unchanged-object suppression', () => {
  it('does not call the provider update when serializable state is unchanged', async () => {
    const api = setup();
    const provider = new FakeProvider();
    api.registerProvider('', provider);
    const object = domainObject('stable', { persisted: '2020-01-01T00:00:00.000Z', version: 1 });

    await api.save(object);
    expect(provider.update).toHaveBeenCalledTimes(1);

    provider.update.mockClear();
    await api.save(object);
    expect(provider.update).not.toHaveBeenCalled();
  });
});

describe('OMCT-C02-L2-03.06 Original-path resolution', () => {
  it('terminates and returns the constructible path on a cyclic location chain', async () => {
    const api = setup();
    const provider = new FakeProvider();
    const a = domainObject('a', { location: 'b' });
    const b = domainObject('b', { location: 'a' });
    provider.get.mockImplementation(async (keyString) => (keyString === 'a' ? a : b));
    api.registerProvider('', provider);

    const path = await api.getOriginalPath('a');

    expect(path.map((object) => object.keyString)).toEqual(['a', 'b']);
  });
});
