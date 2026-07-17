import { Signal, signal } from '@angular/core';

/**
 * Freezes a rendered snapshot while telemetry keeps buffering, then follows live
 * data again on resume. A user-originated (conductor) bounds change clears the
 * pause. Shared by plots (OMCT-C07-L2-02.06) and, later, telemetry tables (C08).
 *
 * The controller only owns the paused flag; the view captures and renders the
 * frozen snapshot so the same controller serves both point buffers and row sets.
 */
export class PauseController {
  private readonly _paused = signal(false);
  readonly paused: Signal<boolean> = this._paused.asReadonly();

  pause(): void {
    this._paused.set(true);
  }

  resume(): void {
    this._paused.set(false);
  }

  toggle(): void {
    this._paused.update((paused) => !paused);
  }

  isPaused(): boolean {
    return this._paused();
  }

  /** A user-originated bounds change (e.g. the time conductor) clears the pause. */
  clearForUserBounds(): void {
    if (this._paused()) {
      this._paused.set(false);
    }
  }
}
