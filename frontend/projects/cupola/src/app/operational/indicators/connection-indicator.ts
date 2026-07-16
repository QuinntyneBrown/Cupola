import { computed, inject } from '@angular/core';
import { PersistenceStatusService, StatusIndicator } from '@cupola/core';

/**
 * Persistence connection indicator over `PersistenceStatusService`, preserving
 * the label and dot-state mapping of the original status-bar markup. Must run
 * inside an injection context.
 * Requirement: OMCT-C14-L2-05.01 (registered indicator).
 */
export function createConnectionIndicator(): StatusIndicator {
  const state = inject(PersistenceStatusService).connectionState;
  return {
    key: 'connection',
    priority: 90,
    testId: 'connection-indicator',
    textSignal: computed(() => {
      switch (state()) {
        case 'connected':
          return 'Connected';
        case 'pending':
          return 'Pending';
        case 'disconnected':
          return 'Disconnected';
        default:
          return 'Unknown';
      }
    }),
    cssClass: computed(() => {
      switch (state()) {
        case 'connected':
          return 'cp-dot--ok';
        case 'pending':
          return 'cp-dot--caution';
        case 'disconnected':
          return 'cp-dot--critical';
        default:
          return '';
      }
    }),
  };
}
