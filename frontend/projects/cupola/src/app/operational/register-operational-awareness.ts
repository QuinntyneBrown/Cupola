import { inject } from '@angular/core';
import { CUPOLA_CONFIG, DefaultUserService, IndicatorService } from '@cupola/core';

import { createClockIndicator } from './indicators/clock-indicator';
import { createConnectionIndicator } from './indicators/connection-indicator';
import { registerNotificationIndicator } from './indicators/notification-indicator';
import { PerformanceIndicator } from './indicators/performance-indicator';
import { UrlHealthIndicator } from './indicators/url-health-indicator';
import { registerUserIndicator } from './indicators/user-indicator';
import { OperatorStatusIndicatorComponent } from './operator-status/operator-status-indicator.component';
import { ExampleStatusProvider } from './providers/example-status-provider';
import { ExampleUserProvider } from './providers/example-user-provider';

/**
 * Registers C14 operational awareness during application startup: the example
 * user and status providers and the status-bar indicators in priority order —
 * connection (90), clock (80), user (70), operator status (60), notifications
 * (50), URL health (40), rendering performance (30). Must run inside an
 * injection context (the app initializer).
 *
 * Requirements: OMCT-C14-L2-01.02–01.04, 02.02, 04.04, 05.01–05.03.
 */
export function registerOperationalAwareness(): void {
  const users = inject(DefaultUserService);
  users.setProvider(new ExampleUserProvider());
  users.setStatusProvider(new ExampleStatusProvider());

  const indicators = inject(IndicatorService);
  indicators.register(createConnectionIndicator());
  indicators.register(createClockIndicator());
  registerUserIndicator();
  indicators.register({
    key: 'operator-status',
    priority: 60,
    component: OperatorStatusIndicatorComponent,
  });
  registerNotificationIndicator();

  const config = inject(CUPOLA_CONFIG);
  const urlHealth = new UrlHealthIndicator({
    url: `${config.apiBaseUrl}/branding`,
    intervalMs: 15_000,
    label: 'API',
  });
  indicators.register(urlHealth.indicator);
  urlHealth.start();

  const performance = new PerformanceIndicator();
  indicators.register(performance.indicator);
  performance.start();
}
