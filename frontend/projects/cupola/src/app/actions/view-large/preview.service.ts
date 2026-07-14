import { Injectable, signal } from '@angular/core';

/**
 * Tracks whether a large-view preview is currently active so the embedded
 * view can restore its state when the preview overlay is destroyed.
 * Requirement: OMCT-C15-L2-02.06.
 */
@Injectable({ providedIn: 'root' })
export class PreviewService {
  private readonly active = signal(false);

  readonly activePreview = this.active.asReadonly();

  open(): void {
    this.active.set(true);
  }

  close(): void {
    this.active.set(false);
  }
}
