import { NotificationService, ProgressUpdate } from '@cupola/core';

/**
 * Fake notification service standing behind the B13 contract so consuming
 * capabilities build and test before C14 delivers the provider.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export class FakeNotificationService extends NotificationService {
  readonly log: { severity: string; message: string }[] = [];
  override info(message: string): void {
    this.log.push({ severity: 'info', message });
  }
  override alert(message: string): void {
    this.log.push({ severity: 'alert', message });
  }
  override error(message: string): void {
    this.log.push({ severity: 'error', message });
  }
  override progress(message: string) {
    this.log.push({ severity: 'progress', message });
    return { update: (_: ProgressUpdate) => {}, dismiss: () => {} };
  }
}
