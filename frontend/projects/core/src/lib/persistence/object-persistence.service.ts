import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ObjectsGateway } from '../gateways/objects-gateway';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { NotificationService } from '../notifications/notification.service';
import { ObjectUpdatesService } from '../objects/object-updates.service';

/** Coordinates saves, conflict notification, and retention of unsaved operator state. */
@Injectable({ providedIn: 'root' })
export class ObjectPersistenceService {
  private readonly objects = inject(ObjectsGateway);
  private readonly notifications = inject(NotificationService);
  private readonly updates = inject(ObjectUpdatesService);
  private readonly unsaved = new Map<string, DomainObject>();

  save(object: DomainObject): Observable<ObjectSaveResult> {
    this.unsaved.set(object.keyString, object);
    return this.objects.saveObject(object).pipe(tap((result) => this.handleResult(result)));
  }

  saveMany(objects: DomainObject[]): Observable<ObjectSaveResult[]> {
    objects.forEach((object) => this.unsaved.set(object.keyString, object));
    return this.objects
      .saveObjects(objects)
      .pipe(tap((results) => results.forEach((result) => this.handleResult(result))));
  }

  getUnsaved(keyString: string): DomainObject | undefined {
    return this.unsaved.get(keyString);
  }

  private handleResult(result: ObjectSaveResult): void {
    if (result.outcome === 'conflict') {
      this.notifications.error(
        `Save conflict for '${result.keyString}'. The unsaved changes were preserved.`,
      );
      return;
    }
    this.unsaved.delete(result.keyString);
    if (result.object) {
      this.updates.emitLocal(result.object);
    }
  }
}
