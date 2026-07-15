import { TypeRegistry } from './type-registry.service';

describe('OMCT-C02-L2-01.02 Type registration and retrieval', () => {
  it('returns the standardized type for a registered key', () => {
    const registry = new TypeRegistry();

    registry.register({ key: 'folder', name: 'Folder', creatable: true });

    expect(registry.get('folder')).toEqual({ key: 'folder', name: 'Folder', creatable: true });
  });

  it('defaults creatable to false when the definition omits it', () => {
    const registry = new TypeRegistry();

    registry.register({ key: 'telemetry', name: 'Telemetry Point' });

    expect(registry.get('telemetry')?.creatable).toBe(false);
  });

  it('returns undefined for an unregistered key', () => {
    expect(new TypeRegistry().get('missing')).toBeUndefined();
  });

  it('lists only creatable types', () => {
    const registry = new TypeRegistry();
    registry.register({ key: 'folder', name: 'Folder', creatable: true });
    registry.register({ key: 'telemetry', name: 'Telemetry Point' });

    expect(registry.listCreatable().map((type) => type.key)).toEqual(['folder']);
  });
});
