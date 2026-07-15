import { firstValueFrom } from 'rxjs';

import { DomainObject } from '../models/domain-object';
import { LocalStorageObjectProvider } from './local-storage-object-provider';

describe('LocalStorageObjectProvider', () => {
  const object: DomainObject = {
    identifier: { namespace: 'local', key: 'folder' },
    keyString: 'local:folder',
    name: 'Folder',
    type: 'folder',
    location: 'ROOT',
    composition: [],
  };

  beforeEach(() => localStorage.clear());

  it('initializes an absent configured area (OMCT-C04-L2-01.01)', () => {
    new LocalStorageObjectProvider(localStorage, 'cupola.test', 'local');
    expect(localStorage.getItem('cupola.test')).toBe('{}');
  });

  it('creates, updates, and retrieves serializable state (OMCT-C04-L2-01.02)', async () => {
    const provider = new LocalStorageObjectProvider(localStorage, 'cupola.test', 'local');

    const created = await firstValueFrom(provider.saveObject(object));
    const updated = await firstValueFrom(
      provider.saveObject({ ...(created.object as DomainObject), name: 'Updated' }),
    );
    const retrieved = await firstValueFrom(provider.getObject('local:folder'));

    expect(created.outcome).toBe('created');
    expect(updated.outcome).toBe('updated');
    expect(retrieved).toEqual(updated.object);
  });

  it('keeps objects isolated to their configured namespace (OMCT-C04-L1-01)', async () => {
    const provider = new LocalStorageObjectProvider(localStorage, 'cupola.test', 'local');
    await expect(
      firstValueFrom(
        provider.saveObject({ ...object, identifier: { namespace: 'other', key: 'folder' } }),
      ),
    ).rejects.toThrow("outside namespace 'local'");
  });

  it('drops prototype-control properties from manipulated content (OMCT-C04-L2-01.03)', async () => {
    localStorage.setItem(
      'cupola.test',
      '{"folder":{"identifier":"local:folder","name":"Safe","type":"folder","location":"ROOT","composition":[],"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}}',
    );
    const provider = new LocalStorageObjectProvider(localStorage, 'cupola.test', 'local');

    const retrieved = await firstValueFrom(provider.getObject('local:folder'));

    expect(retrieved.name).toBe('Safe');
    expect((Object.prototype as { polluted?: boolean }).polluted).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(retrieved, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(retrieved, 'constructor')).toBe(false);
  });
});
