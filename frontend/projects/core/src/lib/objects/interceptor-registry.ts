import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { Identifier } from '../models/identifier';

/**
 * Post-retrieval interceptor applied to objects resolved through the
 * {@link ObjectApi}. Requirement: OMCT-C02-L2-01.05.
 */
export interface ObjectInterceptor {
  appliesTo(identifier: Identifier, object: DomainObject | undefined): boolean;
  invoke(identifier: Identifier, object: DomainObject | undefined): DomainObject;
}

/** Registry of object interceptors, applied in registration order. */
@Injectable({ providedIn: 'root' })
export class InterceptorRegistry {
  private readonly interceptors: ObjectInterceptor[] = [];

  register(interceptor: ObjectInterceptor): void {
    this.interceptors.push(interceptor);
  }

  all(): ObjectInterceptor[] {
    return [...this.interceptors];
  }

  getApplicable(identifier: Identifier, object: DomainObject | undefined): ObjectInterceptor[] {
    return this.interceptors.filter((interceptor) => interceptor.appliesTo(identifier, object));
  }
}
