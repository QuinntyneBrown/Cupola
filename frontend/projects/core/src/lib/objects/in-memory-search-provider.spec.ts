import { DomainObject } from '../models/domain-object';
import { InMemorySearchProvider } from './in-memory-search-provider';

function domainObject(key: string, name: string): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name,
    type: 'folder',
    location: null,
    composition: [],
  };
}

function indexed(): InMemorySearchProvider {
  const provider = new InMemorySearchProvider();
  provider.indexAll([
    domainObject('1', 'Solar Array Voltage'),
    domainObject('2', 'Battery Temperature'),
    domainObject('3', 'Solar Panel Current'),
  ]);
  return provider;
}

describe('OMCT-C02-L2-04.02 In-memory partial and exact search', () => {
  it('returns partial matches', async () => {
    const results = await indexed().search('solar');

    expect(results.map((object) => object.keyString).sort()).toEqual(['1', '3']);
  });

  it('returns an exact match', async () => {
    const results = await indexed().search('Battery Temperature');

    expect(results.map((object) => object.keyString)).toEqual(['2']);
  });

  it('returns an empty result when nothing matches', async () => {
    expect(await indexed().search('gyroscope')).toEqual([]);
  });
});

describe('OMCT-C02-L2-04.03 Search fallback', () => {
  it('executes locally with equivalent matching when shared workers are unavailable', async () => {
    const provider = indexed();

    // jsdom provides no SharedWorker, so the in-process fallback path is taken.
    expect(provider.usesSharedWorker()).toBe(false);
    const results = await provider.search('solar');

    expect(results.map((object) => object.keyString).sort()).toEqual(['1', '3']);
  });
});
