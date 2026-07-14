import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CUPOLA_CONFIG, DomainObject } from '@cupola/core';

import { HttpObjectsGateway } from './http-objects-gateway';

describe('HttpObjectsGateway (supports OMCT-C15-L2-01.03, OMCT-C15-L2-01.04)', () => {
  let gateway: HttpObjectsGateway;
  let http: HttpTestingController;

  const domainObject: DomainObject = {
    identifier: { namespace: '', key: 'mine' },
    keyString: 'mine',
    name: 'My Items',
    type: 'folder',
    location: 'ROOT',
    composition: ['station-displays', 'ops-notebook'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPOLA_CONFIG, useValue: { apiBaseUrl: '/api', hubUrl: '/hubs/realtime' } },
        HttpObjectsGateway,
      ],
    });
    gateway = TestBed.inject(HttpObjectsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets a domain object by keyString', () => {
    let received: DomainObject | undefined;
    gateway.getObject('mine').subscribe((object) => (received = object));

    http.expectOne('/api/objects/mine').flush(domainObject);

    expect(received).toEqual(domainObject);
  });

  it('gets composition children in order', () => {
    let received: DomainObject[] | undefined;
    gateway.getComposition('ROOT').subscribe((children) => (received = children));

    http.expectOne('/api/objects/ROOT/composition').flush([domainObject]);

    expect(received).toEqual([domainObject]);
  });

  it('gets annotations targeting an object', () => {
    let count = -1;
    gateway.getAnnotations('ops-notebook').subscribe((annotations) => (count = annotations.length));

    http.expectOne('/api/objects/ops-notebook/annotations').flush([]);

    expect(count).toBe(0);
  });

  it('updates an object name via PUT', () => {
    let received: DomainObject | undefined;
    gateway.updateObject('mine', { name: 'Renamed' }).subscribe((object) => (received = object));

    const request = http.expectOne('/api/objects/mine');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Renamed' });
    request.flush({ ...domainObject, name: 'Renamed' });

    expect(received?.name).toBe('Renamed');
  });
});
