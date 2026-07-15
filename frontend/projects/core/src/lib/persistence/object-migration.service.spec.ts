import { ObjectMigrationService } from './object-migration.service';
import { convertLegacyDomainObject } from './object-utils';

describe('persistence evolution', () => {
  it('converts legacy string identifiers and composition entries (OMCT-C04-L2-04.02)', () => {
    const converted = convertLegacyDomainObject({
      identifier: 'legacy:layout',
      name: 'Layout',
      type: 'layout',
      location: 'legacy:root',
      composition: ['legacy:a', { namespace: 'external', key: 'b' }],
    });

    expect(converted.identifier).toEqual({ namespace: 'legacy', key: 'layout' });
    expect(converted.keyString).toBe('legacy:layout');
    expect(converted.location).toBe('legacy:root');
    expect(converted.composition).toEqual(['legacy:a', 'external:b']);
  });

  it('applies registered migrations before returning persisted state (OMCT-C04-L2-04.01)', () => {
    const migrations = new ObjectMigrationService();
    migrations.register({
      id: 'rename-legacy-folder',
      appliesTo: (object) => object.type === 'legacy-folder',
      migrate: (object) => ({ ...object, type: 'folder', name: `${object.name} migrated` }),
    });

    const migrated = migrations.migrate({
      identifier: 'local:old',
      name: 'Old',
      type: 'legacy-folder',
      location: null,
      composition: [],
    });

    expect(migrated.type).toBe('folder');
    expect(migrated.name).toBe('Old migrated');
  });
});
