import { Injectable } from '@angular/core';

import { ObjectType, ObjectTypeDefinition } from './object-type';

/**
 * Registry of domain-object type definitions, keyed by unique type key.
 * Requirement: OMCT-C02-L2-01.02 (type registration and retrieval).
 */
@Injectable({ providedIn: 'root' })
export class TypeRegistry {
  private readonly types = new Map<string, ObjectType>();

  /** Registers a type definition, standardizing optional fields. */
  register(definition: ObjectTypeDefinition): void {
    this.types.set(definition.key, { ...definition, creatable: definition.creatable ?? false });
  }

  /** The standardized type for a key, or undefined when none is registered. */
  get(key: string): ObjectType | undefined {
    return this.types.get(key);
  }

  /** All registered types. */
  list(): ObjectType[] {
    return [...this.types.values()];
  }

  /** Registered types operators may create. */
  listCreatable(): ObjectType[] {
    return this.list().filter((type) => type.creatable);
  }
}
