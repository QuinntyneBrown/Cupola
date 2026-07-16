import { Injectable, inject } from '@angular/core';

import { AbortRegistry } from '../routing/abort-registry';
import { DomainObject } from '../models/domain-object';
import { TelemetryFilter } from '../models/telemetry-filter';
import { TelemetryValue } from '../models/telemetry-value';
import { TimeContext } from '../time/time-context';
import { MetadataRegistry } from './metadata-registry.service';
import { TelemetryCollection } from './telemetry-collection';
import { canonicalFilterKey } from './telemetry-filtering';
import { TelemetryDatum, TelemetryProvider } from './telemetry-provider';
import { TelemetryRequest, TelemetryRequestOptions } from './telemetry-request';
import { SubscriptionCache } from './subscription-cache';

type Strategy = 'latest' | 'batch';

/**
 * Routes telemetry requests and subscriptions to compatible providers, applies
 * time-context defaults, shares realtime subscriptions, and shapes delivery by
 * strategy.
 *
 * Requirements: OMCT-C06-L2-01.01–01.04, 02.01–02.05, 04.01.
 */
@Injectable({ providedIn: 'root' })
export class TelemetryApiService {
  private readonly time = inject(TimeContext);
  private readonly abortRegistry = inject(AbortRegistry);
  private readonly metadata = inject(MetadataRegistry);
  private readonly providers: TelemetryProvider[] = [];
  private readonly cache = new SubscriptionCache();

  addProvider(provider: TelemetryProvider): void {
    this.providers.push(provider);
  }

  /**
   * Loads telemetry for an object. Selects the first supporting provider (01.01),
   * resolves an empty array when none supports it (01.02), fills bounds/domain from
   * the time context (01.03), and cancels on navigation when the caller supplies no
   * signal (01.04).
   */
  async request(object: DomainObject, options?: TelemetryRequestOptions): Promise<TelemetryValue[]> {
    const provider = this.providers.find((candidate) => candidate.supportsRequest(object));
    if (!provider) {
      return [];
    }

    let request = this.resolve(options);
    if (request.signal?.aborted) {
      return [];
    }

    let unregister = () => {};
    if (!request.signal) {
      const controller = new AbortController();
      unregister = this.abortRegistry.register(() => controller.abort());
      request = { ...request, signal: controller.signal };
    }

    try {
      return await provider.request(object, request);
    } finally {
      unregister();
    }
  }

  /**
   * Subscribes to realtime telemetry, sharing one provider subscription per object
   * (02.01/02.02) and shaping delivery: `latest` yields one datum (02.03), `batch`
   * yields an array (02.04); legacy single-datum providers relay unchanged (02.05).
   * Active filters forward to the provider and fork the shared subscription per
   * canonical filter set (B08, OMCT-C10-L2-04.03).
   */
  subscribe(
    object: DomainObject,
    callback: (datum: TelemetryDatum) => void,
    options?: { strategy?: Strategy; filters?: TelemetryFilter[] },
  ): () => void {
    const provider = this.providers.find((candidate) => candidate.supportsSubscribe(object));
    if (!provider) {
      return () => {};
    }
    const strategy = options?.strategy ?? 'latest';
    const filters = options?.filters;
    const filterKey = canonicalFilterKey(filters);
    const shaped = (raw: TelemetryDatum) => callback(this.shape(raw, strategy));
    return this.cache.subscribe(
      filterKey ? `${object.keyString}::${filterKey}` : object.keyString,
      (emit) => provider.subscribe(object, emit, filters?.length ? { filters } : undefined),
      shaped,
    );
  }

  /** Builds a bounded telemetry collection for an object (04.01). */
  collection(object: DomainObject): TelemetryCollection {
    return new TelemetryCollection(object, this, this.time, this.metadata.getMetadata(object));
  }

  private resolve(options?: TelemetryRequestOptions): TelemetryRequest {
    return {
      ...options,
      bounds: options?.bounds ?? this.time.bounds(),
      domain: options?.domain ?? this.time.timeSystem().key,
    };
  }

  private shape(raw: TelemetryDatum, strategy: Strategy): TelemetryDatum {
    if (strategy === 'batch') {
      return Array.isArray(raw) ? raw : [raw];
    }
    return Array.isArray(raw) ? raw[raw.length - 1] : raw;
  }
}
