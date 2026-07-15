import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { CompositionProvider } from './composition-provider';
import { RootRegistry } from './root-registry.service';

/** Key string of the synthetic root object whose children are the registered roots. */
export const ROOT_KEY_STRING = 'ROOT';

/**
 * Composition provider for the synthetic root object: its children are the
 * registered roots in priority order. Requirement: OMCT-C02-L2-03.05.
 */
@Injectable({ providedIn: 'root' })
export class RootObjectCompositionProvider implements CompositionProvider {
  private readonly registry = inject(RootRegistry);

  appliesTo(object: DomainObject): boolean {
    return object.keyString === ROOT_KEY_STRING;
  }

  async load(): Promise<string[]> {
    return this.registry.getRoots();
  }
}
