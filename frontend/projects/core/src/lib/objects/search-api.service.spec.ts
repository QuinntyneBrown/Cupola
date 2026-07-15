import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { SearchGateway } from '../gateways/search-gateway';
import { DomainObject } from '../models/domain-object';
import { SearchResults } from '../models/search-results';
import { GatewaySearchProvider } from './gateway-search-provider';
import { SearchApi } from './search-api.service';
import { SearchProvider } from './search-provider';

function domainObject(key: string): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'folder',
    location: null,
    composition: [],
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('OMCT-C02-L2-04.01 Federated provider search', () => {
  it('returns one promise per provider and runs the searches in parallel', async () => {
    const api = new SearchApi();
    const order: string[] = [];
    const slow: SearchProvider = {
      search: async () => {
        order.push('slow-start');
        await flush();
        order.push('slow-end');
        return [domainObject('a')];
      },
    };
    const fast: SearchProvider = {
      search: async () => {
        order.push('fast');
        return [domainObject('b')];
      },
    };
    api.addProvider(slow);
    api.addProvider(fast);

    const promises = api.search('q');

    expect(promises).toHaveLength(2);
    // The fast provider runs before the slow provider resolves: not serialized.
    expect(order).toEqual(['slow-start', 'fast']);

    const results = await Promise.all(promises);
    expect(results.flat().map((object) => object.keyString).sort()).toEqual(['a', 'b']);
  });

  it('merges provider results de-duplicated by key string', async () => {
    const api = new SearchApi();
    api.addProvider({ search: async () => [domainObject('shared'), domainObject('a')] });
    api.addProvider({ search: async () => [domainObject('shared'), domainObject('b')] });

    const merged = await api.searchAll('q');

    expect(merged.map((object) => object.keyString).sort()).toEqual(['a', 'b', 'shared']);
  });

  it('federates the server search gateway as a provider', async () => {
    class SearchGatewayStub extends SearchGateway {
      override search(): Observable<SearchResults> {
        return of({ objects: [domainObject('from-server')], annotations: [] });
      }
    }
    TestBed.configureTestingModule({
      providers: [GatewaySearchProvider, { provide: SearchGateway, useClass: SearchGatewayStub }],
    });

    const results = await TestBed.inject(GatewaySearchProvider).search('q');

    expect(results.map((object) => object.keyString)).toEqual(['from-server']);
  });
});
