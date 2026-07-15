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
  DeviceClassifierService,
  ObjectsGateway,
  NotificationService,
  RealtimeGateway,
  RouteEventsService,
  SearchGateway,
  ThemeService,
  UrlParamsService,
} from '@cupola/core';
import {
  FakeRealtimeGateway,
  FakeNotificationService,
  CouchObjectsGateway,
  HttpBrandingGateway,
  HttpObjectsGateway,
  HttpSearchGateway,
  SignalRRealtimeGateway,
} from '@cupola/api';
import { FORMS_CONTROL_SOURCE, FormsService } from '@cupola/components';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { registerDefaultActions } from './actions/register-default-actions';
import { registerStandardInspectorViews } from './inspector/register-standard-inspector-views';
import { registerDefaultToolbars } from './toolbars/register-default-toolbars';
import { registerDefaultViews } from './views/register-default-views';

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
    { provide: BrandingGateway, useClass: HttpBrandingGateway },
    { provide: NotificationService, useClass: FakeNotificationService },
    {
      provide: RealtimeGateway,
      useClass: environment.e2e ? FakeRealtimeGateway : SignalRRealtimeGateway,
    },
    { provide: FORMS_CONTROL_SOURCE, useExisting: FormsService },
    provideAppInitializer(() => {
      inject(ThemeService).installTheme('darkmatter');
      inject(BrandingService).load();
      inject(RealtimeGateway).connect();
      inject(DeviceClassifierService).start();
      inject(RouteEventsService);
      inject(UrlParamsService);
      registerDefaultViews();
      registerStandardInspectorViews();
      registerDefaultActions();
      registerDefaultToolbars();
    }),
  ],
};
