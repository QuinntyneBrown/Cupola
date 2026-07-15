import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import {
  Annotation,
  CouchSearchFolderProvider,
  DomainObject,
  ObjectMigrationService,
  ObjectSaveResult,
  ObjectsGateway,
  PersistenceStatusService,
} from '@cupola/core';

import { CouchObjectQueue } from './couch-object-queue';
import { HttpObjectsGateway } from './http-objects-gateway';

/** Configured remote provider with batching, migrations, search composition, and direct fallback. */
@Injectable()
export class CouchObjectsGateway extends ObjectsGateway {
  private readonly transport = inject(HttpObjectsGateway);
  private readonly migrations = inject(ObjectMigrationService);
  private readonly status = inject(PersistenceStatusService);
  private readonly searchFolders = inject(CouchSearchFolderProvider);
  private readonly queue = new CouchObjectQueue(this.transport);

  override getObject(keyString: string): Observable<DomainObject> {
    return this.status
      .track(this.queue.get(keyString))
      .pipe(map((value) => this.migrations.migrate(value, keyString)));
  }

  override getComposition(keyString: string): Observable<DomainObject[]> {
    return this.getObject(keyString).pipe(
      switchMap((object) =>
        this.searchFolders.appliesTo(object)
          ? this.searchFolders.load(object)
          : this.status.track(this.transport.getComposition(keyString)),
      ),
      map((objects) => objects.map((object) => this.migrations.migrate(object))),
    );
  }

  override getAnnotations(keyString: string): Observable<Annotation[]> {
    return this.status.track(this.transport.getAnnotations(keyString));
  }

  override updateObject(keyString: string, changes: { name: string }): Observable<DomainObject> {
    return this.status.track(this.transport.updateObject(keyString, changes));
  }

  override saveObject(object: DomainObject): Observable<ObjectSaveResult> {
    return this.status.track(this.queue.save(object));
  }

  override getObjects(keyStrings: string[]): Observable<DomainObject[]> {
    return this.status
      .track(this.transport.getObjects(keyStrings))
      .pipe(map((objects) => objects.map((object) => this.migrations.migrate(object))));
  }

  override saveObjects(objects: DomainObject[]): Observable<ObjectSaveResult[]> {
    return this.status.track(this.transport.saveObjects(objects));
  }
}
