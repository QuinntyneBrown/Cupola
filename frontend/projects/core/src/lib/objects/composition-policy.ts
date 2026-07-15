import { DomainObject } from '../models/domain-object';

/**
 * Decides whether a proposed parent-child relationship is permitted.
 * Requirement: OMCT-C02-L2-03.04.
 */
export interface CompositionPolicy {
  allow(parent: DomainObject, child: DomainObject): boolean;
}
