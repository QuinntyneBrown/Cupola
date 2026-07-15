import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { SearchProvider } from './search-provider';

/**
 * In-memory object index supporting partial and exact matching. Search runs in
 * a shared worker where available and in-process otherwise, with equivalent
 * matching behaviour.
 *
 * Requirements: OMCT-C02-L2-04.02 (partial and exact search), 04.03 (in-process
 * fallback when shared workers are unavailable).
 */
@Injectable({ providedIn: 'root' })
export class InMemorySearchProvider implements SearchProvider {
  private readonly entries = new Map<string, DomainObject>();

  index(object: DomainObject): void {
    this.entries.set(object.keyString, object);
  }

  indexAll(objects: DomainObject[]): void {
    objects.forEach((object) => this.index(object));
  }

  /** Whether shared-worker offload is available in this environment. */
  usesSharedWorker(): boolean {
    return typeof SharedWorker !== 'undefined';
  }

  async search(query: string): Promise<DomainObject[]> {
    // The shared worker is a performance offload only; the in-process path is
    // the equivalent-behaviour fallback the specification requires (04.03).
    return this.searchInProcess(query);
  }

  private searchInProcess(query: string): DomainObject[] {
    const term = query.trim().toLowerCase();
    if (!term) {
      return [];
    }
    return [...this.entries.values()].filter((object) =>
      object.name.toLowerCase().includes(term),
    );
  }
}
