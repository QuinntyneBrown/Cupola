import { DomainObject } from '@cupola/core';

/**
 * Serves the synthetic fault-management root object for the `fault` namespace.
 * Requirement: OMCT-C14-L2-03.02.
 */
export const FAULT_ROOT_KEY = 'fault:management';

export class FaultRootProvider {
  get(keyString: string): Promise<DomainObject | undefined> {
    if (keyString !== FAULT_ROOT_KEY) {
      return Promise.resolve(undefined);
    }
    return Promise.resolve({
      identifier: { namespace: 'fault', key: 'management' },
      keyString: FAULT_ROOT_KEY,
      name: 'Fault Management',
      type: 'fault-management',
      location: 'ROOT',
      composition: [],
    });
  }
}
