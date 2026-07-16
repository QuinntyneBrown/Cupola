import { computed, inject } from '@angular/core';
import { DefaultNotificationService, IndicatorService } from '@cupola/core';

/**
 * Registers the notification indicator showing the current notification
 * count. Must run inside an injection context.
 * Requirement: OMCT-C14-L2-04.04.
 */
export function registerNotificationIndicator(): void {
  const notifications = inject(DefaultNotificationService);
  inject(IndicatorService).register({
    key: 'notifications',
    priority: 50,
    glyph: 'i-bell',
    testId: 'notification-indicator',
    textSignal: computed(() => String(notifications.count())),
  });
}
