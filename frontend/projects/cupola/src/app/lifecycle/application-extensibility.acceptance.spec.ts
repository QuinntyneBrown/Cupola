import {
  ActionRegistry,
  BrandingService,
  InspectorViewRegistry,
  NotificationService,
  ObjectsGateway,
  RealtimeGateway,
  SearchGateway,
  SelectionService,
  ThemeService,
  TimeContext,
  ToolbarRegistry,
  RouteEventsService,
  UrlParamsService,
  UserService,
  ViewRegistry,
} from '@cupola/core';

import { CupolaApplication } from './cupola-application';
import { cupolaPlugins } from './plugin-catalog';
import { buildTestAppConfig } from './testing/test-bootstrap-support';

describe('OMCT-C01-L2-01.01 Plugin installation', () => {
  it('calls the installed plugin function once with the active application instance', () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });
    const plugin = jest.fn();

    app.install(plugin);

    expect(plugin).toHaveBeenCalledTimes(1);
    expect(plugin).toHaveBeenCalledWith(app);
  });
});

// Cupola's application constructor runs synchronously, but the capability
// accessors below are backed by an Angular environment injector that is
// created asynchronously (see startHeadless()). This maps
// "a newly constructed application instance" onto "an application instance
// whose startup sequence has completed", consistent with the OMCT-C01-L2-01.03
// mapping of "construction completes" onto Angular's DI-based initialization.
describe('OMCT-C01-L2-01.02 Public capability APIs', () => {
  it('exposes the object, composition, telemetry, time, action, user, notification, branding, view, inspector, and toolbar interfaces', async () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });

    await app.startHeadless();

    expect(app.objects).toBeInstanceOf(ObjectsGateway);
    expect(app.search).toBeInstanceOf(SearchGateway);
    expect(app.realtime).toBeInstanceOf(RealtimeGateway);
    expect(app.time).toBeInstanceOf(TimeContext);
    expect(app.user).toBeInstanceOf(UserService);
    expect(app.notifications).toBeInstanceOf(NotificationService);
    expect(app.actions).toBeInstanceOf(ActionRegistry);
    expect(app.views).toBeInstanceOf(ViewRegistry);
    expect(app.inspectorViews).toBeInstanceOf(InspectorViewRegistry);
    expect(app.toolbars).toBeInstanceOf(ToolbarRegistry);
    expect(app.selection).toBeInstanceOf(SelectionService);
    expect(app.theme).toBeInstanceOf(ThemeService);
    expect(app.branding).toBeInstanceOf(BrandingService);
    expect(app.routeEvents).toBeInstanceOf(RouteEventsService);
    expect(app.urlParams).toBeInstanceOf(UrlParamsService);
    expect(app.config).toEqual({
      apiBaseUrl: 'http://test.invalid',
      hubUrl: 'http://test.invalid/hub',
    });

    app.destroy();
  });
});

describe('OMCT-C01-L2-01.03 Default plugin installation', () => {
  it('registers the baseline views and actions declared in the application config during startup', async () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });

    await app.startHeadless();

    expect(app.views.getByProviderKey('plot-single')).toBeDefined();
    expect(app.actions.getAction('open')).toBeDefined();

    app.destroy();
  });
});

describe('OMCT-C01-L2-01.04 Published plugin catalog', () => {
  it('exposes the plugin factories published in the plugin catalog as app.plugins', () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });

    expect(app.plugins).toBe(cupolaPlugins);
  });
});

describe('OMCT-C01-L2-01.05 Build identification', () => {
  it('returns version, buildDate, revision, and branch from buildInfo', async () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });

    await app.startHeadless();
    app.branding.load();

    const buildInfo = app.buildInfo();

    expect(buildInfo).toEqual({
      version: '0.0.0-test',
      buildDate: '2026-01-01T00:00:00Z',
      revision: 'test-revision',
      branch: 'test-branch',
    });

    app.destroy();
  });
});
