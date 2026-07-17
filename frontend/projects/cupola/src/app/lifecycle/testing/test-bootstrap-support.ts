import { ApplicationConfig, Component, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  Annotation,
  BrandingGateway,
  BrandingInfo,
  BuildInfo,
  CUPOLA_CONFIG,
  DomainObject,
  ObjectsGateway,
  RealtimeGateway,
  RouteEventsService,
  SearchGateway,
  SearchResults,
  ThemeService,
  UserService,
  NotificationService,
  TimeContext,
  UrlParamsService,
} from '@cupola/core';
import { FakeNotificationService, FakeRealtimeGateway, FakeTimeContext, FakeUserService } from '@cupola/api';

import { routes } from '../../app.routes';
import { registerDefaultActions } from '../../actions/register-default-actions';
import { registerStandardInspectorViews } from '../../inspector/register-standard-inspector-views';
import { registerDefaultToolbars } from '../../toolbars/register-default-toolbars';
import { registerDefaultViews } from '../../views/register-default-views';
import { registerPlotViews } from '../../views/plot/register-plot-views';

const BUILD_INFO: BuildInfo = {
  version: '0.0.0-test',
  buildDate: '2026-01-01T00:00:00Z',
  revision: 'test-revision',
  branch: 'test-branch',
};

class StubObjectsGateway extends ObjectsGateway {
  override getObject(): Observable<DomainObject> {
    throw new Error('not used by acceptance specs');
  }
  override getComposition(): Observable<DomainObject[]> {
    return of([]);
  }
  override getAnnotations(): Observable<Annotation[]> {
    return of([]);
  }
  override updateObject(): Observable<DomainObject> {
    throw new Error('not used by acceptance specs');
  }
}

class StubSearchGateway extends SearchGateway {
  override search(): Observable<SearchResults> {
    return of({ objects: [], annotations: [] });
  }
}

class StubBrandingGateway extends BrandingGateway {
  override getBranding(): Observable<BrandingInfo> {
    return of({
      appTitle: 'Cupola',
      tagline: 'Mission operations frontend',
      smallLogoImage: 'assets/cupola-logo.svg',
      aboutHtml: '<p>About</p>',
      licenseUrl: '/licenses',
    });
  }
  override getBuildInfo(): Observable<BuildInfo> {
    return of(BUILD_INFO);
  }
}

/** Standalone component used as the mounted root in rendered-startup specs. */
@Component({
  selector: 'cp-test-root',
  standalone: true,
  template: '<p>cupola test shell</p>',
})
export class TestRootComponent {}

/**
 * Builds an `ApplicationConfig` for C01 acceptance specs: real routing and
 * the real baseline registration functions (OMCT-C01-L2-01.03), backed by
 * in-memory/fake gateways so startup never performs network I/O.
 */
export function buildTestAppConfig(): ApplicationConfig {
  return {
    providers: [
      provideRouter(routes, withHashLocation()),
      { provide: CUPOLA_CONFIG, useValue: { apiBaseUrl: 'http://test.invalid', hubUrl: 'http://test.invalid/hub' } },
      { provide: ObjectsGateway, useClass: StubObjectsGateway },
      { provide: SearchGateway, useClass: StubSearchGateway },
      { provide: BrandingGateway, useClass: StubBrandingGateway },
      { provide: RealtimeGateway, useClass: FakeRealtimeGateway },
      { provide: UserService, useClass: FakeUserService },
      { provide: NotificationService, useClass: FakeNotificationService },
      { provide: TimeContext, useClass: FakeTimeContext },
      provideAppInitializer(() => {
        inject(ThemeService).installTheme('darkmatter');
        inject(RouteEventsService);
        inject(UrlParamsService);
        registerDefaultViews();
        registerStandardInspectorViews();
        registerPlotViews();
        registerDefaultActions();
        registerDefaultToolbars();
      }),
    ],
  };
}
