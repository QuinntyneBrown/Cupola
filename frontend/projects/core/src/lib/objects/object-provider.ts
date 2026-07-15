import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';

/**
 * A namespace provider the {@link ObjectApi} routes object operations to
 * (OMCT-C02-L2-01.03). Providers resolve `undefined` for keys they cannot
 * supply so the missing-object interceptor can substitute a placeholder.
 */
export interface ObjectProvider {
  get(keyString: string): Promise<DomainObject | undefined>;
  /** Persists a not-yet-persisted object. */
  create?(object: DomainObject): Promise<ObjectSaveResult>;
  /** Persists changes to an already-persisted object. */
  update?(object: DomainObject): Promise<ObjectSaveResult>;
}
