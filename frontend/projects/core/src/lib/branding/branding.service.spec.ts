import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { BrandingGateway } from '../gateways/branding-gateway';
import { BrandingInfo } from '../models/branding-info';
import { BuildInfo } from '../models/build-info';
import { BrandingService } from './branding.service';

const BRANDING: BrandingInfo = {
  appTitle: 'Cupola',
  tagline: 'Mission operations frontend',
  smallLogoImage: 'assets/cupola-logo.svg',
  aboutHtml: '<p>About</p>',
  licenseUrl: '/licenses',
};

const BUILD: BuildInfo = {
  version: '0.1.0',
  buildDate: '2026-07-13T00:00:00Z',
  revision: 'a3f9c21',
  branch: 'main',
};

class BrandingGatewayStub extends BrandingGateway {
  override getBranding(): Observable<BrandingInfo> {
    return of(BRANDING);
  }
  override getBuildInfo(): Observable<BuildInfo> {
    return of(BUILD);
  }
}

describe('OMCT-C15-L2-05.03 BrandingService', () => {
  let service: BrandingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: BrandingGateway, useClass: BrandingGatewayStub }],
    });
    service = TestBed.inject(BrandingService);
  });

  it('exposes the stored branding and build options after loading', () => {
    expect(service.branding()).toBeNull();

    service.load();

    expect(service.branding()).toEqual(BRANDING);
    expect(service.buildInfo()).toEqual(BUILD);
  });
});
