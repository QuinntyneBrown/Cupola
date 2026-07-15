import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { CompositionProvider } from './composition-provider';
import { ObjectApi } from './object-api.service';

/**
 * Model-backed composition: children are the object's own `composition` array,
 * and membership/order changes persist the mutated parent through the
 * {@link ObjectApi} save path. Requirement: OMCT-C02-L2-03.02.
 */
@Injectable({ providedIn: 'root' })
export class DefaultCompositionProvider implements CompositionProvider {
  private readonly objects = inject(ObjectApi);

  appliesTo(object: DomainObject): boolean {
    return Array.isArray(object.composition);
  }

  async load(object: DomainObject): Promise<string[]> {
    return [...object.composition];
  }

  async add(parent: DomainObject, childKeyString: string): Promise<void> {
    if (parent.composition.includes(childKeyString)) {
      return;
    }
    await this.persist(parent, [...parent.composition, childKeyString]);
  }

  async remove(parent: DomainObject, childKeyString: string): Promise<void> {
    await this.persist(
      parent,
      parent.composition.filter((keyString) => keyString !== childKeyString),
    );
  }

  async reorder(parent: DomainObject, oldIndex: number, newIndex: number): Promise<void> {
    const composition = [...parent.composition];
    const [moved] = composition.splice(oldIndex, 1);
    composition.splice(newIndex, 0, moved);
    await this.persist(parent, composition);
  }

  private async persist(parent: DomainObject, composition: string[]): Promise<void> {
    await this.objects.save({ ...parent, composition });
  }
}
