import { Clock } from '../clock';

/**
 * A clock that emits the host's current wall-clock time at a fixed interval.
 * Ticking starts on first subscription and stops when the last subscriber
 * unsubscribes. Requirement: OMCT-C05-L2-03.04.
 */
export class LocalClock implements Clock {
  readonly key = 'local';
  readonly name = 'Local Clock';

  private readonly listeners = new Set<(tick: number) => void>();
  private handle: ReturnType<typeof setInterval> | null = null;

  /** @param period tick interval in milliseconds. */
  constructor(private readonly period = 1000) {}

  subscribe(callback: (tick: number) => void): () => void {
    this.listeners.add(callback);
    if (this.handle === null) {
      this.handle = setInterval(() => this.emit(), this.period);
    }
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.handle !== null) {
        clearInterval(this.handle);
        this.handle = null;
      }
    };
  }

  private emit(): void {
    const now = Date.now();
    for (const listener of [...this.listeners]) {
      listener(now);
    }
  }
}
