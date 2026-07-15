import { StaticModelProvider, StaticRootPlugin, StaticRootRegistry } from './static-model-provider';

describe('static persistence trees', () => {
  const data = {
    rootId: 'old:root',
    openmct: {
      'old:root': {
        identifier: 'old:root',
        name: 'Station',
        type: 'folder',
        location: 'ROOT',
        composition: ['old:child'],
      },
      'old:child': {
        identifier: 'old:child',
        name: 'Display',
        type: 'layout',
        location: 'old:root',
        composition: [],
        configuration: { items: { 'old:root': { linked: 'old:child' } } },
      },
    },
  };

  it('remaps root, children, locations, compositions, and nested layout references (OMCT-C04-L2-03.02)', () => {
    const provider = new StaticModelProvider(data, { namespace: 'station', key: 'root' });
    const root = provider.get('station:root');
    const child = provider.getComposition('station:root')[0] as unknown as Record<string, unknown>;
    const configuration = child['configuration'] as { items: Record<string, { linked: string }> };

    expect(root.location).toBe('ROOT');
    expect(root.composition).toEqual(['station:0']);
    expect(child['location']).toBe('station:root');
    expect(configuration.items['station:root'].linked).toBe('station:0');
  });

  it('loads a configured resource and registers provider objects and root (OMCT-C04-L2-03.01)', async () => {
    const registry: StaticRootRegistry = {
      addProvider: jest.fn(),
      addRoot: jest.fn(),
    };
    const plugin = new StaticRootPlugin(registry, async () => data);

    const provider = await plugin.initialize({
      resourceUrl: '/station.json',
      rootIdentifier: { namespace: 'station', key: 'root' },
    });

    expect(provider.get('station:root').name).toBe('Station');
    expect(registry.addProvider).toHaveBeenCalledWith('station', provider);
    expect(registry.addRoot).toHaveBeenCalledWith({ namespace: 'station', key: 'root' });
  });
});
