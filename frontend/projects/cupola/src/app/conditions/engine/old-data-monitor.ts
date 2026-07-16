/**
 * Per-criterion no-data timers backing the old-data criterion
 * (OMCT-C10-L2-01.05). Each tracked id fires stale after its configured
 * interval and resets whenever a matching datum arrives.
 */
export class OldDataMonitor {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly intervals = new Map<string, number>();
  private readonly staleFlags = new Map<string, boolean>();

  /** @param onStale invoked with the criterion id when its interval elapses. */
  constructor(private readonly onStale: (id: string) => void) {}

  /** Begins (or restarts) the no-data timer for a criterion. */
  track(id: string, intervalMs: number): void {
    this.intervals.set(id, intervalMs);
    this.reset(id);
  }

  /** Clears the stale flag and restarts the timer after a datum arrives. */
  reset(id: string): void {
    const interval = this.intervals.get(id);
    if (interval === undefined) {
      return;
    }
    this.clearTimer(id);
    this.staleFlags.set(id, false);
    this.timers.set(
      id,
      setTimeout(() => {
        this.staleFlags.set(id, true);
        this.onStale(id);
      }, interval),
    );
  }

  /** Whether the criterion's interval has elapsed without a datum. */
  isStale(id: string): boolean {
    return this.staleFlags.get(id) ?? false;
  }

  /** Whether any criterion is being tracked. */
  get isEmpty(): boolean {
    return this.intervals.size === 0;
  }

  destroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.intervals.clear();
    this.staleFlags.clear();
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
