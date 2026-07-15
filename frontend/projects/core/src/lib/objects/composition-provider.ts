import { DomainObject } from '../models/domain-object';

/**
 * Supplies and mutates the composition of the objects it applies to.
 * Requirements: OMCT-C02-L2-03.02 (model-backed), 03.03 (custom providers).
 */
export interface CompositionProvider {
  appliesTo(object: DomainObject): boolean;
  /** Loads the child key strings of an object. */
  load(object: DomainObject): Promise<string[]>;
  add?(parent: DomainObject, childKeyString: string): Promise<void>;
  remove?(parent: DomainObject, childKeyString: string): Promise<void>;
  reorder?(parent: DomainObject, oldIndex: number, newIndex: number): Promise<void>;
  /** Relays provider-originated membership changes; returns an unsubscribe function. */
  observe?(object: DomainObject, listener: (childKeyStrings: string[]) => void): () => void;
}
