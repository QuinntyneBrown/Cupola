import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { SearchGateway } from '../gateways/search-gateway';
import { CouchSearchFolder, CouchSearchFolderProvider } from './couch-search-folder-provider';

describe('CouchSearchFolderProvider', () => {
  it('returns configured database query results as composition (OMCT-C04-L2-03.03)', async () => {
    const child = {
      identifier: { namespace: '', key: 'match' },
      keyString: 'match',
      name: 'Matching object',
      type: 'folder',
      location: null,
      composition: [],
    };
    const search = { search: jest.fn(() => of({ objects: [child], annotations: [] })) };
    TestBed.configureTestingModule({
      providers: [CouchSearchFolderProvider, { provide: SearchGateway, useValue: search }],
    });
    const folder: CouchSearchFolder = {
      identifier: { namespace: '', key: 'search' },
      keyString: 'search',
      name: 'Search',
      type: 'couch-search-folder',
      location: 'ROOT',
      composition: [],
      query: 'power',
    };

    const children = await firstValueFrom(TestBed.inject(CouchSearchFolderProvider).load(folder));

    expect(search.search).toHaveBeenCalledWith('power');
    expect(children).toEqual([child]);
  });
});
