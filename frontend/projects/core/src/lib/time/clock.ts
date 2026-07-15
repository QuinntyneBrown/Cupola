/**
 * A source of real-time ticks. An active clock drives a time context into
 * real-time mode, emitting successive time values that the context turns into
 * moving bounds. Requirements: OMCT-C05-L2-03.02, OMCT-C05-L2-03.03.
 */
export interface Clock {
  /** Unique key used to register and activate the clock. */
  readonly key: string;
  /** Human-readable clock name. */
  readonly name: string;
  /**
   * Subscribes to ticks. The callback receives the current clock value (epoch
   * milliseconds). Returns an unsubscribe handle.
   */
  subscribe(callback: (tick: number) => void): () => void;
}
