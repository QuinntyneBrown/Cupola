import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { SearchProvider } from './search-provider';

/**
 * Federates object search across registered providers.
 * Requirement: OMCT-C02-L2-04.01 (parallel provider search).
 */
@Injectable({ providedIn: 'root' })
export class SearchApi {
  private readonly providers: SearchProvider[] = [];

  addProvider(provider: SearchProvider): void {
    this.providers.push(provider);
  }

  /**
   * Starts every provider search concurrently and returns one promise per
   * provider result set, without serializing the searches (OMCT-C02-L2-04.01).
   */
  search(query: string): Promise<DomainObject[]>[] {
    return this.providers.map((provider) => provider.search(query));
  }

  /** Awaits all providers and merges results, de-duplicated by key string. */
  async searchAll(query: string): Promise<DomainObject[]> {
    const resultSets = await Promise.all(this.search(query));
    const byKeyString = new Map<string, DomainObject>();
    for (const object of resultSets.flat()) {
      byKeyString.set(object.keyString, object);
    }
    return [...byKeyString.values()];
  }
}
