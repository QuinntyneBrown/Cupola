import { DomainObject } from '../models/domain-object';
import { DefaultMetadataProvider } from './default-metadata-provider';
import { MetadataRegistry } from './metadata-registry.service';
import { TelemetryMetadataProvider } from './telemetry-metadata-view';

function telemetryObject(over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key: 'pt' },
    keyString: 'pt',
    name: 'pt',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: 'V' },
    ...over,
  };
}

function namedProvider(priority: number, tag: string): TelemetryMetadataProvider {
  return {
    priority,
    supportsMetadata: () => true,
    getMetadata: () => [{ key: 'value', name: tag, hint: 'range', priority: 1 }],
  };
}

describe('OMCT-C06-L2-03.01 Metadata-provider priority', () => {
  it('selects the highest-priority provider, breaking ties by registration order', () => {
    const registry = new MetadataRegistry();
    registry.addProvider(namedProvider(10, 'low'));
    registry.addProvider(namedProvider(90, 'high'));
    registry.addProvider(namedProvider(50, 'mid'));
    registry.addProvider(namedProvider(90, 'high-later'));

    expect(registry.getMetadata(telemetryObject())!.value('value')!.name).toBe('high');
  });
});

describe('OMCT-C06-L2-03.02 Domain and range ordering', () => {
  it('exposes domain and range values in priority order', () => {
    const registry = new MetadataRegistry();
    registry.addProvider({
      supportsMetadata: () => true,
      getMetadata: () => [
        { key: 'v2', hint: 'range', priority: 2 },
        { key: 'v1', hint: 'range', priority: 1 },
        { key: 'd1', hint: 'domain', priority: 1 },
      ],
    });

    const view = registry.getMetadata(telemetryObject())!;

    expect(view.ranges().map((value) => value.key)).toEqual(['v1', 'v2']);
    expect(view.domains().map((value) => value.key)).toEqual(['d1']);
  });
});

describe('OMCT-C06-L2-03.03 Default metadata', () => {
  it('derives normalized metadata from the object telemetry definition', () => {
    const registry = new MetadataRegistry();
    registry.addProvider(new DefaultMetadataProvider());

    const view = registry.getMetadata(telemetryObject())!;

    expect(view.domains().map((value) => value.key)).toEqual(['timestamp']);
    expect(view.ranges().map((value) => value.key)).toEqual(['value']);
    expect(view.value('value')!.unit).toBe('V');
  });
});
