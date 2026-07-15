import { TelemetryDatum } from './telemetry-provider';

interface CacheEntry {
  unsubscribe: () => void;
  consumers: Set<(datum: TelemetryDatum) => void>;
}

/**
 * Shares one provider subscription per key, fanning each emission out to every
 * consumer and releasing the provider subscription when the last consumer leaves.
 * Requirements: OMCT-C06-L2-02.01 (subscription sharing), 02.02 (final unsubscribe).
 */
export class SubscriptionCache {
  private readonly entries = new Map<string, CacheEntry>();

  subscribe(
    key: string,
    start: (emit: (datum: TelemetryDatum) => void) => () => void,
    consumer: (datum: TelemetryDatum) => void,
  ): () => void {
    let entry = this.entries.get(key);
    if (!entry) {
      const consumers = new Set<(datum: TelemetryDatum) => void>();
      const unsubscribe = start((datum) => consumers.forEach((notify) => notify(datum)));
      entry = { unsubscribe, consumers };
      this.entries.set(key, entry);
    }
    entry.consumers.add(consumer);

    return () => {
      const current = this.entries.get(key);
      if (!current) {
        return;
      }
      current.consumers.delete(consumer);
      if (current.consumers.size === 0) {
        current.unsubscribe();
        this.entries.delete(key);
      }
    };
  }

  /** Number of live shared subscriptions (for assertions). */
  get activeKeys(): number {
    return this.entries.size;
  }
}
