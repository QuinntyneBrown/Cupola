import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CUPOLA_CONFIG, SearchResults } from '@cupola/core';

import { HttpSearchGateway } from './http-search-gateway';

describe('HttpSearchGateway (supports OMCT-C15-L2-05.05)', () => {
  let gateway: HttpSearchGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPOLA_CONFIG, useValue: { apiBaseUrl: '/api', hubUrl: '/hubs/realtime' } },
        HttpSearchGateway,
      ],
    });
    gateway = TestBed.inject(HttpSearchGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('queries combined object and annotation search results', () => {
    const results: SearchResults = { objects: [], annotations: [] };
    let received: SearchResults | undefined;

    gateway.search('solar').subscribe((r) => (received = r));

    http.expectOne('/api/search?q=solar').flush(results);

    expect(received).toEqual(results);
  });
});
