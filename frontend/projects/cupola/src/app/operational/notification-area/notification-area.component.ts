import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DefaultNotificationService } from '@cupola/core';

/**
 * Fixed banner stack for active notifications with per-banner dismissal and a
 * progress bar for progress notifications.
 * Requirements: OMCT-C14-L2-04.01, OMCT-C14-L2-04.02, OMCT-C14-L2-04.03.
 */
@Component({
  selector: 'cp-notification-area',
  templateUrl: './notification-area.component.html',
  styleUrl: './notification-area.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationAreaComponent {
  private readonly service = inject(DefaultNotificationService);

  protected readonly banners = computed(() =>
    this.service.notifications().map((notification) => ({
      notification,
      severityClass: `banner--${notification.severity}`,
      percent: notification.progress?.percent ?? null,
      progressText: notification.progress?.text ?? '',
    })),
  );

  protected dismiss(id: number): void {
    this.service.dismiss(id);
  }
}
