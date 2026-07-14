import { DomainObject } from '@cupola/core';

/** Inputs every object-view component receives from its provider. */
export interface ViewInputs {
  object: DomainObject;
  objectPath: DomainObject[];
}
