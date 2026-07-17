import { Signal, computed, signal } from '@angular/core';

import { ImageFrame } from './image-history';

/**
 * Focus model for the imagery view (OMCT-C11-L2-01.02–01.04): tracking-latest
 * auto-focuses the newest frame as it arrives; selecting an older thumbnail
 * enters historical mode; arrow keys step to adjacent frames; End re-joins the
 * live edge.
 */
export class FocusController {
  private readonly selectedTime = signal<number | null>(null);

  /** Whether focus tracks the newest frame (the initial state). */
  readonly trackingLatest: Signal<boolean> = computed(() => this.selectedTime() === null);

  /** Resolves the focused frame for the current history. */
  focusedFrame(frames: ImageFrame[]): ImageFrame | null {
    if (frames.length === 0) {
      return null;
    }
    const selected = this.selectedTime();
    if (selected === null) {
      return frames[frames.length - 1];
    }
    // The selected instant, else the nearest frame at or before it (frames can
    // drop off the buffer as bounds change).
    let candidate: ImageFrame | null = null;
    for (const frame of frames) {
      if (frame.time <= selected) {
        candidate = frame;
      }
    }
    return candidate ?? frames[0];
  }

  /** Thumbnail selection (01.03). */
  select(time: number): void {
    this.selectedTime.set(time);
  }

  /** Arrow-key navigation to the adjacent frame (01.04); no-ops at the edges. */
  step(frames: ImageFrame[], direction: 1 | -1): void {
    const focused = this.focusedFrame(frames);
    if (!focused) {
      return;
    }
    const index = frames.findIndex((frame) => frame.time === focused.time);
    const next = frames[index + direction];
    if (!next) {
      return;
    }
    // Stepping to the newest frame still holds focus there (historical mode);
    // only End re-joins the live edge.
    this.selectedTime.set(next.time);
  }

  /** Re-joins the live edge (End). */
  followLatest(): void {
    this.selectedTime.set(null);
  }
}
