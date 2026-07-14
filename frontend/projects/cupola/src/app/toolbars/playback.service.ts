import { Injectable, signal } from '@angular/core';

/** Shared live-telemetry playback state toggled from the toolbar. */
@Injectable({ providedIn: 'root' })
export class PlaybackService {
  private readonly pausedState = signal(false);

  readonly paused = this.pausedState.asReadonly();

  toggle(): void {
    this.pausedState.update((paused) => !paused);
  }
}
