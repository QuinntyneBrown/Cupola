import { DomainObject } from '../models/domain-object';

/** A source of searchable domain objects federated by the {@link SearchApi}. */
export interface SearchProvider {
  search(query: string): Promise<DomainObject[]>;
}
