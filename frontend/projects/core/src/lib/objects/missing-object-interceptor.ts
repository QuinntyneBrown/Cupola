import { DomainObject } from '../models/domain-object';
import { Identifier } from '../models/identifier';
import { makeKeyString } from '../models/key-string';
import { ObjectInterceptor } from './interceptor-registry';

/** A placeholder domain object standing in for a reference that no provider supplies. */
export interface MissingDomainObject extends DomainObject {
  readonly isMissing: true;
}

/** Builds the missing-object placeholder for an unavailable reference. */
export function createMissingObject(identifier: Identifier): MissingDomainObject {
  const keyString = makeKeyString(identifier);
  return {
    identifier,
    keyString,
    name: `Missing: ${keyString}`,
    type: 'unknown',
    location: null,
    composition: [],
    isMissing: true,
  };
}

/** Whether an object is a missing-object placeholder (OMCT-C02-L2-01.06). */
export function isMissingObject(object: DomainObject): object is MissingDomainObject {
  return (object as MissingDomainObject).isMissing === true;
}

/**
 * Interceptor that represents an unavailable reference with a missing-object
 * placeholder. Requirement: OMCT-C02-L2-01.06.
 */
export class MissingObjectInterceptor implements ObjectInterceptor {
  appliesTo(_identifier: Identifier, object: DomainObject | undefined): boolean {
    return object === undefined;
  }

  invoke(identifier: Identifier): DomainObject {
    return createMissingObject(identifier);
  }
}
