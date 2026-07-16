import { signal } from '@angular/core';
import { StatusIndicator } from '@cupola/core';

/**
 * Calculates and displays browser rendering frames per second from sampled
 * animation frames, recomputed once per one-second window.
 * Requirement: OMCT-C14-L2-05.03.
 */
export class PerformanceIndicator {
  private readonly fps = signal('– fps');
  private frameCount = 0;
  private windowStart: number | null = null;
  private running = false;

  readonly indicator: StatusIndicator = {
    key: 'performance',
    priority: 30,
    testId: 'performance-indicator',
    textSignal: this.fps.asReadonly(),
  };

  constructor(
    private readonly raf: (callback: FrameRequestCallback) => number = (callback) =>
      requestAnimationFrame(callback),
  ) {}

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.windowStart = null;
    this.frameCount = 0;
    this.raf((timestamp) => this.onFrame(timestamp));
  }

  stop(): void {
    this.running = false;
  }

  private onFrame(timestamp: number): void {
    if (!this.running) {
      return;
    }
    if (this.windowStart === null) {
      this.windowStart = timestamp;
    } else {
      this.frameCount += 1;
      const elapsed = timestamp - this.windowStart;
      if (elapsed >= 1000) {
        this.fps.set(`${Math.round((this.frameCount * 1000) / elapsed)} fps`);
        this.frameCount = 0;
        this.windowStart = timestamp;
      }
    }
    this.raf((next) => this.onFrame(next));
  }
}
