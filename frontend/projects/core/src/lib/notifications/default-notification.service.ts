import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';

import {
  NotificationService,
  NotificationSeverity,
  ProgressUpdate,
} from './notification.service';

/** A notification currently on display. */
export interface ActiveNotification {
  id: number;
  severity: NotificationSeverity | 'progress';
  message: string;
  progress?: ProgressUpdate;
}

/** Auto-dismiss timeout for information notifications, overridable in tests. */
export const INFO_AUTO_DISMISS_MS = new InjectionToken<number>('INFO_AUTO_DISMISS_MS', {
  providedIn: 'root',
  factory: () => 5000,
});

/**
 * Default `NotificationService`: information notifications auto-dismiss after
 * the configured timeout, alerts and errors persist until dismissed, progress
 * notifications update through their returned control.
 * Requirements: OMCT-C14-L2-04.01, OMCT-C14-L2-04.02, OMCT-C14-L2-04.03,
 * OMCT-C14-L2-04.04.
 */
@Injectable({ providedIn: 'root' })
export class DefaultNotificationService extends NotificationService {
  private readonly infoTimeoutMs = inject(INFO_AUTO_DISMISS_MS);
  private readonly active = signal<readonly ActiveNotification[]>([]);
  private nextId = 1;

  readonly notifications = this.active.asReadonly();
  readonly count = computed(() => this.active().length);

  override info(message: string): void {
    const id = this.push('info', message);
    setTimeout(() => this.dismiss(id), this.infoTimeoutMs);
  }

  override alert(message: string): void {
    this.push('alert', message);
  }

  override error(message: string): void {
    this.push('error', message);
  }

  override progress(message: string): { update(p: ProgressUpdate): void; dismiss(): void } {
    const id = this.push('progress', message, { percent: null });
    return {
      update: (p: ProgressUpdate) =>
        this.active.update((list) =>
          list.map((notification) =>
            notification.id === id ? { ...notification, progress: p } : notification,
          ),
        ),
      dismiss: () => this.dismiss(id),
    };
  }

  dismiss(id: number): void {
    this.active.update((list) => list.filter((notification) => notification.id !== id));
  }

  private push(
    severity: ActiveNotification['severity'],
    message: string,
    progress?: ProgressUpdate,
  ): number {
    const id = this.nextId++;
    this.active.update((list) => [...list, { id, severity, message, progress }]);
    return id;
  }
}
