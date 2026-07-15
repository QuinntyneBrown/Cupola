/**
 * B13 — Notifications and indicators (contract skeleton).
 * Owner: C14 · Consumers: C15 (status bar) · Stability: medium.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */

export type NotificationSeverity = 'info' | 'alert' | 'error'; // OMCT-C14-L2-04.01

export interface ProgressUpdate {
  percent: number | null; // null renders indeterminate progress
  text?: string;
}

export abstract class NotificationService {
  abstract info(message: string): void;
  abstract alert(message: string): void;
  abstract error(message: string): void;
  abstract progress(message: string): { update(p: ProgressUpdate): void; dismiss(): void };
}
