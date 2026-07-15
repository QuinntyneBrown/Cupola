import { Observable } from 'rxjs';

import { Annotation } from '../models/annotation';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';

export abstract class ObjectsGateway {
  abstract getObject(keyString: string): Observable<DomainObject>;
  abstract getComposition(keyString: string): Observable<DomainObject[]>;
  abstract getAnnotations(keyString: string): Observable<Annotation[]>;
  abstract updateObject(keyString: string, changes: { name: string }): Observable<DomainObject>;
  /** B04 — creates or updates one object; a conflict is reported in the result, not thrown. */
  abstract saveObject(object: DomainObject): Observable<ObjectSaveResult>;
  /** B04 — batched retrieval; unknown key strings are omitted from the result. */
  abstract getObjects(keyStrings: string[]): Observable<DomainObject[]>;
  /** B04 — batched save with one result per submitted object. */
  abstract saveObjects(objects: DomainObject[]): Observable<ObjectSaveResult[]>;
}
