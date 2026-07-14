import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BrandingInfo, BuildInfo, CUPOLA_CONFIG } from '@cupola/core';

import { HttpBrandingGateway } from './http-branding-gateway';

describe('HttpBrandingGateway (supports OMCT-C15-L2-05.03, OMCT-C15-L2-05.04)', () => {
  let gateway: HttpBrandingGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPOLA_CONFIG, useValue: { apiBaseUrl: '/api', hubUrl: '/hubs/realtime' } },
        HttpBrandingGateway,
      ],
    });
    gateway = TestBed.inject(HttpBrandingGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets branding options', () => {
    const branding: BrandingInfo = {
      appTitle: 'Cupola',
      tagline: 'Mission operations frontend',
      smallLogoImage: 'assets/cupola-logo.svg',
      aboutHtml: '<p>About</p>',
      licenseUrl: '/licenses',
    };
    let received: BrandingInfo | undefined;

    gateway.getBranding().subscribe((b) => (received = b));
    http.expectOne('/api/branding').flush(branding);

    expect(received).toEqual(branding);
  });

  it('gets build info', () => {
    const buildInfo: BuildInfo = {
      version: '0.1.0',
      buildDate: '2026-07-13T00:00:00Z',
      revision: 'a3f9c21',
      branch: 'main',
    };
    let received: BuildInfo | undefined;

    gateway.getBuildInfo().subscribe((b) => (received = b));
    http.expectOne('/api/branding/build-info').flush(buildInfo);

    expect(received).toEqual(buildInfo);
  });
});
