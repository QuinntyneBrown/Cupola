import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SearchGateway } from '../gateways/search-gateway';
import { DomainObject } from '../models/domain-object';
import { SearchProvider } from './search-provider';

/**
 * Federated search provider backed by the server search transport (B03), so the
 * existing `/api/search` endpoint participates in {@link SearchApi} federation.
 * Requirement: OMCT-C02-L2-04.01.
 */
@Injectable({ providedIn: 'root' })
export class GatewaySearchProvider implements SearchProvider {
  private readonly gateway = inject(SearchGateway);

  async search(query: string): Promise<DomainObject[]> {
    const results = await firstValueFrom(this.gateway.search(query));
    return results.objects;
  }
}
