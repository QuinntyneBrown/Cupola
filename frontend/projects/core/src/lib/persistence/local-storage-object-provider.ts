import { Observable, defer, map, of, throwError } from 'rxjs';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { Annotation } from '../models/annotation';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { parseKeyString } from '../models/key-string';
import { ObjectMigrationService } from './object-migration.service';
import { parsePersistedJson } from './safe-json';

type ObjectMap = Record<string, unknown>;

/** Namespace-scoped browser-local object provider. */
export class LocalStorageObjectProvider extends ObjectsGateway {
  constructor(
    private readonly storage: Storage,
    private readonly area: string,
    private readonly namespace: string,
    private readonly migrations = new ObjectMigrationService(),
  ) {
    super();
    if (this.storage.getItem(this.area) === null) {
      this.storage.setItem(this.area, '{}');
    }
  }

  override getObject(keyString: string): Observable<DomainObject> {
    const identifier = parseKeyString(keyString);
    if (identifier.namespace && identifier.namespace !== this.namespace) {
      return throwError(() => new Error(`Object '${keyString}' is outside this namespace.`));
    }
    const stored = this.read()[identifier.key];
    if (stored === undefined) {
      return throwError(() => new Error(`Object '${keyString}' was not found.`));
    }
    return of(this.migrations.migrate(stored, `${this.namespace}:${identifier.key}`));
  }

  override getComposition(keyString: string): Observable<DomainObject[]> {
    return this.getObject(keyString).pipe(
      map((parent) => {
        const objectMap = this.read();
        return parent.composition
          .map((child) => parseKeyString(child).key)
          .filter((key) => objectMap[key] !== undefined)
          .map((key) => this.migrations.migrate(objectMap[key], `${this.namespace}:${key}`));
      }),
    );
  }

  override getAnnotations(_keyString: string): Observable<Annotation[]> {
    return of([]);
  }

  override updateObject(keyString: string, changes: { name: string }): Observable<DomainObject> {
    return this.getObject(keyString).pipe(
      map((object) => {
        const result = this.persist({ ...object, name: changes.name });
        return result.object as DomainObject;
      }),
    );
  }

  override saveObject(object: DomainObject): Observable<ObjectSaveResult> {
    return defer(() => of(this.persist(object)));
  }

  override getObjects(keyStrings: string[]): Observable<DomainObject[]> {
    const objectMap = this.read();
    return of(
      keyStrings.flatMap((keyString) => {
        const key = parseKeyString(keyString).key;
        return objectMap[key] === undefined
          ? []
          : [this.migrations.migrate(objectMap[key], `${this.namespace}:${key}`)];
      }),
    );
  }

  override saveObjects(objects: DomainObject[]): Observable<ObjectSaveResult[]> {
    return defer(() => of(objects.map((object) => this.persist(object))));
  }

  private persist(object: DomainObject): ObjectSaveResult {
    if (object.identifier.namespace !== this.namespace) {
      throw new Error(`Object '${object.keyString}' is outside namespace '${this.namespace}'.`);
    }
    const objectMap = this.read();
    const existingValue = objectMap[object.identifier.key];
    const existing = existingValue
      ? this.migrations.migrate(existingValue, object.keyString)
      : undefined;
    if (existing && (object.version ?? 0) !== (existing.version ?? 0)) {
      return { keyString: object.keyString, outcome: 'conflict', object: existing };
    }

    const now = new Date().toISOString();
    const saved: DomainObject = {
      ...object,
      created: existing?.created ?? object.created ?? now,
      modified: now,
      version: (existing?.version ?? 0) + 1,
    };
    objectMap[object.identifier.key] = saved;
    this.storage.setItem(this.area, JSON.stringify(objectMap));
    return {
      keyString: saved.keyString,
      outcome: existing ? 'updated' : 'created',
      object: saved,
    };
  }

  private read(): ObjectMap {
    return parsePersistedJson<ObjectMap>(this.storage.getItem(this.area) ?? '{}');
  }
}
