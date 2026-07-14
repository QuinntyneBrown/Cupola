import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { BrandingGateway, BrandingInfo, BrandingService, BuildInfo } from '@cupola/core';

import { AboutDialogComponent } from './about-dialog.component';

const BRANDING: BrandingInfo = {
  appTitle: 'Cupola',
  tagline: 'Mission operations frontend',
  smallLogoImage: 'assets/cupola-logo.svg',
  aboutHtml: '<p>About Cupola.</p>',
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

describe('OMCT-C15-L2-05.04 AboutDialogComponent', () => {
  let fixture: ComponentFixture<AboutDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: BrandingGateway, useClass: BrandingGatewayStub }],
    });
    TestBed.inject(BrandingService).load();
    fixture = TestBed.createComponent(AboutDialogComponent);
    fixture.detectChanges();
  });

  it('renders the app title, build, and license information', () => {
    const text = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('[data-testid="about-title"]').textContent).toContain(
      'Cupola',
    );
    expect(fixture.nativeElement.querySelector('[data-testid="about-version"]').textContent).toContain(
      '0.1.0',
    );
    expect(
      fixture.nativeElement.querySelector('[data-testid="about-revision"]').textContent,
    ).toContain('a3f9c21');
    expect(text).toContain('Mission operations frontend');
    expect(fixture.nativeElement.querySelector('[data-testid="about-license"]')).not.toBeNull();
  });
});
