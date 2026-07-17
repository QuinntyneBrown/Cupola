import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import {
  BrandingGateway,
  BrandingService,
  CUPOLA_CONFIG,
  DefaultNotificationService,
  DefaultUserService,
  DeviceClassifierService,
  GlobalTimeContext,
  ObjectsGateway,
  NotificationService,
  RealtimeGateway,
  RouteEventsService,
  SearchGateway,
  TelemetryGateway,
  ThemeService,
  TimeContext,
  UrlParamsService,
  UrlTimeSyncService,
  UserService,
} from '@cupola/core';
import {
  FakeRealtimeGateway,
  CouchObjectsGateway,
  HttpBrandingGateway,
  HttpObjectsGateway,
  HttpSearchGateway,
  HttpTelemetryGateway,
  SignalRRealtimeGateway,
} from '@cupola/api';
import { FORMS_CONTROL_SOURCE, FormsService } from '@cupola/components';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { registerConditions } from './conditions/register-conditions';
import { registerDefaultActions } from './actions/register-default-actions';
import { registerFaults } from './faults/register-faults';
import { registerStandardInspectorViews } from './inspector/register-standard-inspector-views';
import { registerOperationalAwareness } from './operational/register-operational-awareness';
import { registerDefaultObjects } from './objects/register-default-objects';
import { registerDefaultTelemetry } from './telemetry/register-default-telemetry';
import { registerDefaultTime } from './time/register-default-time';
import { registerTimeViews } from './time/register-time-views';
import { registerDefaultToolbars } from './toolbars/register-default-toolbars';
import { registerDefaultViews } from './views/register-default-views';
import { registerPlotViews } from './views/plot/register-plot-views';
import { registerTabularViews } from './tabular/register-tabular-views';
import { registerPlans } from './plans/register-plans';
import { registerNotebook } from './notebook/register-notebook';
import { registerLayouts } from './layouts/register-layouts';
import { NowProvider } from './plans/plan/now-provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    {
      provide: CUPOLA_CONFIG,
      useValue: { apiBaseUrl: environment.apiBaseUrl, hubUrl: environment.hubUrl },
    },
    HttpObjectsGateway,
    { provide: ObjectsGateway, useClass: CouchObjectsGateway },
    { provide: SearchGateway, useClass: HttpSearchGateway },
    HttpTelemetryGateway,
    { provide: TelemetryGateway, useClass: HttpTelemetryGateway },
    { provide: BrandingGateway, useClass: HttpBrandingGateway },
    { provide: NotificationService, useExisting: DefaultNotificationService },
    { provide: UserService, useExisting: DefaultUserService },
    {
      provide: RealtimeGateway,
      useClass: environment.e2e ? FakeRealtimeGateway : SignalRRealtimeGateway,
    },
    { provide: TimeContext, useExisting: GlobalTimeContext },
    { provide: FORMS_CONTROL_SOURCE, useExisting: FormsService },
    provideAppInitializer(() => {
      inject(ThemeService).installTheme('darkmatter');
      inject(BrandingService).load();
      inject(RealtimeGateway).connect();
      inject(DeviceClassifierService).start();
      inject(RouteEventsService);
      inject(UrlParamsService);
      // C02 domain objects: register types, interceptors, composition, and search providers.
      registerDefaultObjects();
      // C06 telemetry: register the default provider, metadata, formats, limits, staleness.
      registerDefaultTelemetry();
      registerDefaultViews();
      registerStandardInspectorViews();
      // C07 plots: register plot/chart types, composition policies, metadata, and
      // view providers before create actions are minted from the creatable types.
      registerPlotViews();
      // C10 conditions: register condition/widget/derived types and views, the
      // composition policy, the filter inspector, and derived providers before
      // create actions are minted from the creatable types.
      registerConditions();
      // C08 tabular: register table/LAD/gauge/autoflow types, composition
      // policies, view providers, and the gauge inspector before create actions
      // are minted from the creatable types.
      registerTabularViews();
      // C12 planning: register plan/gantt/time-strip/time-list/monitoring types,
      // view and inspector providers, composition policies, event timeline, and
      // the activity-state / plan-monitoring interceptors and roots before create
      // actions are minted from the creatable types.
      registerPlans();
      // C13 notebooks: register the notebook, restricted-notebook, and annotation
      // types, the notebook view, the copy/export actions, and the known
      // annotation types before create actions are minted from the creatable types.
      registerNotebook();
      // C09 layouts: register display/flexible layout, tabs, hyperlink, and
      // web-page types and views, the layout edit toolbars, the folder list
      // view, and the layout clipboard before create actions are minted from
      // the creatable types.
      registerLayouts();
      registerDefaultActions();
      registerDefaultToolbars();
      // C14 operational awareness: user/status providers, indicators, notifications, faults.
      registerOperationalAwareness();
      registerFaults();
      // C05 time coordination: register defaults, then start URL sync last so
      // startup defaults are not written back over existing URL state.
      registerDefaultTime();
      registerTimeViews();
      inject(UrlTimeSyncService).start();
      // e2e only: expose a conductor bounds setter on the realtime test hook so
      // acceptance tests can drive a user-originated bounds change (the conductor
      // itself has no bounds-editing control). Mirrors the FakeRealtimeGateway
      // hook; no effect in production builds.
      if (environment.e2e) {
        const time = inject(GlobalTimeContext);
        const hook = (window as unknown as { __cupolaE2E?: Record<string, unknown> }).__cupolaE2E;
        if (hook) {
          hook['setBounds'] = (bounds: { start: number; end: number }) => time.setBounds(bounds);
          // C12 time list / plan temporal classification reads a controllable
          // "now"; let acceptance tests pin it for deterministic temporal classes.
          const now = inject(NowProvider);
          hook['setNow'] = (value: number) => now.set(value);
        }
      }
    }),
  ],
};
