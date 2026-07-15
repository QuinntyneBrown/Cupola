import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { SearchGateway } from '@cupola/core';

import { CouchObjectsGateway } from './couch-objects-gateway';
import { HttpObjectsGateway } from './http-objects-gateway';

describe('CouchObjectsGateway', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('intercepts retrieved legacy state before a consumer receives it (OMCT-C04-L2-04.01, OMCT-C04-L2-04.02)', async () => {
    const transport = transportWith({
      identifier: 'legacy:item',
      name: 'Legacy item',
      type: 'folder',
      location: 'legacy:root',
      composition: ['legacy:child'],
    });
    TestBed.configureTestingModule({
      providers: [
        CouchObjectsGateway,
        { provide: HttpObjectsGateway, useValue: transport },
        { provide: SearchGateway, useValue: { search: jest.fn() } },
      ],
    });

    const pending = firstValueFrom(TestBed.inject(CouchObjectsGateway).getObject('legacy:item'));
    jest.runOnlyPendingTimers();
    const object = await pending;

    expect(object.identifier).toEqual({ namespace: 'legacy', key: 'item' });
    expect(object.composition).toEqual(['legacy:child']);
  });

  it('routes configured search folders through database-backed composition (OMCT-C04-L2-03.03)', async () => {
    const folder = {
      identifier: { namespace: '', key: 'search-folder' },
      keyString: 'search-folder',
      name: 'Power search',
      type: 'couch-search-folder',
      location: 'ROOT',
      composition: [],
      query: 'power',
    };
    const match = {
      ...folder,
      identifier: { namespace: '', key: 'match' },
      keyString: 'match',
      type: 'folder',
    };
    const transport = transportWith(folder);
    const search = { search: jest.fn(() => of({ objects: [match], annotations: [] })) };
    TestBed.configureTestingModule({
      providers: [
        CouchObjectsGateway,
        { provide: HttpObjectsGateway, useValue: transport },
        { provide: SearchGateway, useValue: search },
      ],
    });

    const pending = firstValueFrom(
      TestBed.inject(CouchObjectsGateway).getComposition('search-folder'),
    );
    jest.runOnlyPendingTimers();
    const children = await pending;

    expect(search.search).toHaveBeenCalledWith('power');
    expect(children).toEqual([match]);
    expect(transport.getComposition).not.toHaveBeenCalled();
  });
});

function transportWith(object: unknown) {
  return {
    getObject: jest.fn(() => of(object)),
    getObjects: jest.fn(() => of([object])),
    getComposition: jest.fn(() => of([])),
    getAnnotations: jest.fn(() => of([])),
    updateObject: jest.fn(),
    saveObject: jest.fn(),
    saveObjects: jest.fn(),
  };
}
