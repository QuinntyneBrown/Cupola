import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { convertLegacyDomainObject } from './object-utils';

export interface ObjectMigration {
  readonly id: string;
  appliesTo(object: DomainObject): boolean;
  migrate(object: DomainObject): DomainObject;
}

/** Applies legacy conversion and registered migrations before persisted state reaches consumers. */
@Injectable({ providedIn: 'root' })
export class ObjectMigrationService {
  private readonly migrations: ObjectMigration[] = [];

  register(migration: ObjectMigration): () => void {
    if (this.migrations.some((candidate) => candidate.id === migration.id)) {
      throw new Error(`Object migration '${migration.id}' is already registered.`);
    }
    this.migrations.push(migration);
    return () => {
      const index = this.migrations.indexOf(migration);
      if (index >= 0) {
        this.migrations.splice(index, 1);
      }
    };
  }

  migrate(value: unknown, fallbackKeyString?: string): DomainObject {
    return this.migrations.reduce(
      (object, migration) => (migration.appliesTo(object) ? migration.migrate(object) : object),
      convertLegacyDomainObject(value, fallbackKeyString),
    );
  }
}
