import { Injectable, inject } from '@angular/core';
import { Observable, Subject, merge } from 'rxjs';
import { filter } from 'rxjs/operators';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { DomainObject } from '../models/domain-object';

/**
 * Single subscription point for object updates, merging server-pushed
 * updates (SignalR) with locally-applied edits so the shell reflects both.
 */
@Injectable({ providedIn: 'root' })
export class ObjectUpdatesService {
  private readonly realtime = inject(RealtimeGateway);
  private readonly local$ = new Subject<DomainObject>();

  /** Updates for a specific object, from either the server or a local edit. */
  forKeyString(keyString: string): Observable<DomainObject> {
    return merge(
      this.realtime.objectUpdates(keyString),
      this.local$.pipe(filter((object) => object.keyString === keyString)),
    );
  }

  /** Publishes a locally-applied edit (e.g. after a successful PUT). */
  emitLocal(object: DomainObject): void {
    this.local$.next(object);
  }
}
