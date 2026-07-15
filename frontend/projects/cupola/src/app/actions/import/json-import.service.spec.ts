import { TestBed } from '@angular/core/testing';
import { CompositionApi, DomainObject, ObjectApi } from '@cupola/core';

import { JsonImportService } from './json-import.service';

function object(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: key, type: 'folder', location: null, composition: [], ...over };
}

function setup() {
  const saved: DomainObject[] = [];
  const added: DomainObject[] = [];
  const api = {
    save: jest.fn(async (o: DomainObject) => {
      saved.push(o);
      return { keyString: o.keyString, outcome: 'created', object: o };
    }),
    get: jest.fn(async (key: string) => saved.find((o) => o.keyString === key)),
  };
  const composition = { get: jest.fn(() => ({ add: jest.fn(async (o: DomainObject) => void added.push(o)) })) };
  TestBed.configureTestingModule({
    providers: [
      JsonImportService,
      { provide: ObjectApi, useValue: api },
      { provide: CompositionApi, useValue: composition },
    ],
  });
  return { service: TestBed.inject(JsonImportService), saved, added };
}

describe('OMCT-C03-L2-03.04 Import into composition', () => {
  it('creates remapped objects and attaches the imported root to the parent', async () => {
    const { service, saved, added } = setup();
    const document = JSON.stringify({
      cupola: {
        'old-root': object('old-root', { name: 'Imported', composition: ['old-child'] }),
        'old-child': object('old-child', { name: 'Child' }),
      },
      rootId: 'old-root',
      externalIdentifiers: [],
    });

    await service.import(document, object('mine'));

    expect(saved).toHaveLength(2);
    expect(added.map((o) => o.name)).toEqual(['Imported']);
    const importedRoot = saved.find((o) => o.name === 'Imported')!;
    const importedChild = saved.find((o) => o.name === 'Child')!;
    expect(importedRoot.composition).toEqual([importedChild.keyString]);
  });
});

describe('OMCT-C03-L2-03.05 Import identifier integrity', () => {
  it('does not let imported identifier data override the generated identity', async () => {
    const { service, saved } = setup();
    const evil = { ...object('old'), identifier: { namespace: 'evil', key: 'evil' }, keyString: 'evil' };
    const document = JSON.stringify({ cupola: { old: evil }, rootId: 'old', externalIdentifiers: [] });

    await service.import(document, object('mine'));

    expect(saved[0].identifier.namespace).not.toBe('evil');
    expect(saved[0].keyString).not.toBe('evil');
  });
});

describe('OMCT-C03-L2-03.06 Prototype-pollution rejection', () => {
  it('leaves object prototypes unchanged when importing a pollution payload', async () => {
    const { service } = setup();
    const payload =
      '{"cupola":{"x":{"identifier":{"namespace":"","key":"x"},"keyString":"x","name":"X","type":"folder","location":null,"composition":[],"__proto__":{"polluted":true}}},"rootId":"x","externalIdentifiers":[]}';

    await service.import(payload, object('mine'));

    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
  });
});
