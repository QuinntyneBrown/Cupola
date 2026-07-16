import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { StalenessEvent } from './limits';

/** Observes staleness state for the objects it supports. */
export interface StalenessProvider {
  supportsStaleness(object: DomainObject): boolean;
  /** Subscribes to staleness changes; returns an unsubscribe that releases resources. */
  subscribe(object: DomainObject, callback: (event: StalenessEvent) => void): () => void;
}

/**
 * Relays staleness from the first applicable provider and releases the provider
 * subscription on unsubscribe. Requirement: OMCT-C06-L2-04.04.
 */
@Injectable({ providedIn: 'root' })
export class StalenessRegistry {
  private readonly providers: StalenessProvider[] = [];

  addProvider(provider: StalenessProvider): void {
    this.providers.push(provider);
  }

  subscribe(object: DomainObject, callback: (event: StalenessEvent) => void): () => void {
    const provider = this.providers.find((candidate) => candidate.supportsStaleness(object));
    if (!provider) {
      return () => {};
    }
    return provider.subscribe(object, callback);
  }
}
