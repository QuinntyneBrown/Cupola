import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { CompositionCollection } from './composition-collection';
import { CompositionPolicy } from './composition-policy';
import { CompositionProvider } from './composition-provider';
import { ObjectApi } from './object-api.service';

/**
 * Resolves composition collections from registered providers and evaluates
 * composition policies.
 *
 * Requirements: OMCT-C02-L2-03.01 (availability / falsy when unsupported),
 * 03.03 (custom providers), 03.04 (policy gate).
 */
@Injectable({ providedIn: 'root' })
export class CompositionApi {
  private readonly objects = inject(ObjectApi);
  private readonly providers: CompositionProvider[] = [];
  private readonly policies: CompositionPolicy[] = [];

  addProvider(provider: CompositionProvider): void {
    this.providers.push(provider);
  }

  addPolicy(policy: CompositionPolicy): void {
    this.policies.push(policy);
  }

  /**
   * The composition collection for an object, or a falsy result when no
   * registered provider supports it (OMCT-C02-L2-03.01). The most recently
   * registered applicable provider wins, so custom providers override the
   * model-backed default.
   */
  get(object: DomainObject): CompositionCollection | undefined {
    for (let index = this.providers.length - 1; index >= 0; index -= 1) {
      const provider = this.providers[index];
      if (provider.appliesTo(object)) {
        return new CompositionCollection(object, provider, (keyString) =>
          this.objects.get(keyString),
        );
      }
    }
    return undefined;
  }

  /** Whether every applicable policy permits the parent-child relationship. */
  checkPolicy(parent: DomainObject, child: DomainObject): boolean {
    return this.policies.every((policy) => policy.allow(parent, child));
  }
}
