import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DefaultUserService, IndicatorService } from '@cupola/core';

/**
 * Registers the user indicator only when a user provider is configured, so the
 * active name is displayed for the configured-provider case only. Must run
 * inside an injection context.
 * Requirement: OMCT-C14-L2-01.04.
 */
export function registerUserIndicator(): void {
  const users = inject(DefaultUserService);
  if (!users.hasProvider()) {
    return;
  }
  const user = toSignal(users.currentUser(), { initialValue: null });
  inject(IndicatorService).register({
    key: 'user',
    priority: 70,
    glyph: 'i-user',
    testId: 'user-indicator',
    textSignal: computed(() => user()?.name ?? ''),
  });
}
